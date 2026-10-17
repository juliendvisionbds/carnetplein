import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDictionary } from "@/i18n";
import { FOLLOW_UP_SITUATION_KEYS, LOCALES, TRADE_KEYS, type FollowUpSituation } from "@/i18n/config";
import { getFollowUpCopy } from "@/i18n/follow-up";
import { FOLLOW_UP_ELAPSED, buildFollowUp, type FollowUpTrade } from "@/lib/follow-up";
import { followUpAiEnabled, tailorFollowUp } from "@/lib/follow-up-ai";

/**
 * Générateur de relances : réécriture par l’IA à partir des détails donnés sur le client.
 * Le brouillon est reconstruit ici à partir des modèles (rien n’est repris tel quel du navigateur).
 * Rien n’est enregistré. En cas d’échec, le navigateur garde la version standard.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const optionalText = (max: number) => z.string().max(max).optional();

const RequestSchema = z.object({
  locale: z.enum(LOCALES),
  trade: z.custom<FollowUpTrade>((value) => value === "other" || (TRADE_KEYS as readonly unknown[]).includes(value)),
  situation: z.enum(FOLLOW_UP_SITUATION_KEYS as [FollowUpSituation, ...FollowUpSituation[]]),
  elapsed: z.enum(FOLLOW_UP_ELAPSED),
  client: optionalText(60),
  sender: optionalText(60),
  company: optionalText(80),
  project: optionalText(100),
  details: z.string().trim().min(1).max(600),
  /** Champ piège du formulaire : rempli, la demande vient d’un robot. */
  website: z.string().optional(),
});

// Limite par adresse IP, en mémoire (par instance) : de quoi décourager un usage en boucle de l’IA.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  const limited = recent.length >= MAX_PER_WINDOW;
  if (!limited) recent.push(now);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, recent);
  return limited;
}

export async function POST(req: Request) {
  if (!followUpAiEnabled()) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const parsed = RequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { locale, trade, situation, elapsed, client, sender, company, project, details, website } = parsed.data;

  const copy = getFollowUpCopy(locale);
  const { current } = buildFollowUp(copy, { trade, situation, elapsed, client, sender, company, project });
  if (website) return NextResponse.json({ message: current.message });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  try {
    const message = await tailorFollowUp({
      lang: locale,
      trade: trade === "other" ? copy.trades.other.audience : getDictionary(locale).trades.pages[trade].name,
      situation: copy.situations[situation].label,
      step: { when: current.when, goal: current.goal, channel: current.channel },
      draft: current.message,
      details,
    });
    if (!message) return NextResponse.json({ error: "unusable" }, { status: 502 });
    return NextResponse.json({ message });
  } catch (e) {
    // Journal sans le contenu saisi : seuls le type d’erreur et le statut sont gardés.
    if (e instanceof Anthropic.RateLimitError) console.warn("[api/tools/quote-follow-up] limite de l’API atteinte");
    else if (e instanceof Anthropic.APIError) console.error("[api/tools/quote-follow-up] erreur API", e.status, e.name);
    else console.error("[api/tools/quote-follow-up] échec", e instanceof Error ? e.name : "inconnu");
    return NextResponse.json({ error: "failed" }, { status: 502 });
  }
}

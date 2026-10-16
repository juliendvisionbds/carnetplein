import { NextResponse, after } from "next/server";
import { createLeadFromSubmission, makeSubmissionSchema, notifyNewLead, SubmissionError } from "@/lib/leads";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "@/i18n/config";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: getDictionary(DEFAULT_LOCALE).api.unreadable }, { status: 400 });
  }

  // La langue du visiteur détermine celle des messages d’erreur, du dossier et des e-mails.
  const requested = (body as { locale?: unknown } | null)?.locale;
  const lang: Locale = hasLocale(requested) ? requested : DEFAULT_LOCALE;
  const t = getDictionary(lang).api;

  const parsed = makeSubmissionSchema(t).safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? t.invalidForm }, { status: 400 });
  }

  try {
    const { lead, redo } = await createLeadFromSubmission(parsed.data, lang, t);
    after(() => notifyNewLead(lead, redo));
    return NextResponse.json({ token: lead.token, redo });
  } catch (e) {
    if (e instanceof SubmissionError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[api/leads] échec", e);
    return NextResponse.json({ error: t.saveFailed }, { status: 500 });
  }
}

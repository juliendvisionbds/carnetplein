import { randomBytes } from "node:crypto";
import { z } from "zod";
import { diagnose, isAnswered, questions, type Answers } from "@/lib/diagnostic";
import { getStore, type Lead } from "@/lib/store";
import { sendDiagnosticReady, sendNewLeadToAgency } from "@/lib/email";
import { fetchSiteInfo } from "@/lib/site-info";
import { LOCALES, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

export type ApiMessages = Dictionary["api"];

const str = (max: number) => z.string().trim().max(max);

/** Schéma de soumission du diagnostic, avec les messages d’erreur dans la langue du visiteur. */
export function makeSubmissionSchema(t: ApiMessages) {
  return z.object({
    locale: z.enum(LOCALES).optional(),
    answers: z.object({
      volume: str(60).optional(),
      source: z.array(str(60)).max(3).optional(),
      conversion: str(60).optional(),
      response: str(80).optional(),
      autoConfirm: z.boolean().optional(),
      qual: str(80).optional(),
      detail: str(80).optional(),
      quote: str(80).optional(),
      follow: str(80).optional(),
      tracking: str(80).optional(),
    }),
    contact: z.object({
      name: str(120).min(2, t.nameRequired),
      email: z.email(t.emailInvalid).trim().max(200),
      company: str(160).optional(),
      website: str(300).min(3, t.websiteRequired),
      phone: str(40).optional(),
      context: str(1000).optional(),
      consent: z.literal(true, t.consentRequired),
    }),
    utm: z.record(z.string().max(40), z.string().max(200)).optional(),
    /** Champ pot-de-miel : doit rester vide (anti-robots). */
    fax: z.string().max(0).optional(),
  });
}

export type Submission = z.infer<ReturnType<typeof makeSubmissionSchema>>;

export class SubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubmissionError";
  }
}

/** Accepte « monsite.fr », « www.monsite.fr » ou une URL complète ; renvoie une URL normalisée. */
export function normalizeWebsite(raw: string, t: ApiMessages): string {
  let v = raw.trim();
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    throw new SubmissionError(t.websiteInvalid);
  }
  if (!url.hostname.includes(".") || /\s/.test(raw)) {
    throw new SubmissionError(t.websiteInvalidExample);
  }
  return url.href.replace(/\/$/, "");
}

function newToken(): string {
  return randomBytes(18).toString("base64url");
}

export function assertComplete(answers: Answers, t: ApiMessages) {
  for (const q of questions) {
    if (!isAnswered(q, answers)) throw new SubmissionError(t.incomplete);
  }
}

export async function createLeadFromSubmission(input: Submission, lang: Locale, t: ApiMessages): Promise<{ lead: Lead; redo: boolean }> {
  const answers = input.answers as Answers;
  assertComplete(answers, t);
  const website = normalizeWebsite(input.contact.website, t);
  const email = input.contact.email.toLowerCase();
  const d = diagnose(answers);
  const store = getStore();
  // Le métier n’est pas demandé : on le déduit du site du prospect (meilleur effort, 4 s max).
  const site = await fetchSiteInfo(website, lang);

  const common = {
    locale: lang,
    name: input.contact.name,
    email,
    company: input.contact.company || null,
    website,
    phone: input.contact.phone || null,
    context: input.contact.context || null,
    trade: site.trade,
    site_title: site.title,
    site_description: site.description,
    answers,
    priority: d.key,
    secondary: d.secondary,
    intensity: d.intensity,
  };

  const existing = await store.findLeadByEmail(email);
  let lead: Lead;
  let redo = false;
  if (existing) {
    // Même e-mail : on met le dossier à jour sans créer de doublon, en conservant son lien, son étape et ses notes.
    // Un métier corrigé à la main dans le pilotage est conservé.
    lead = await store.updateLead(existing.id, { ...common, trade: existing.trade ?? site.trade, utm: existing.utm ?? input.utm ?? null });
    await store.addEvent(lead.id, "diagnostic_redone", { priority: d.key });
    redo = true;
  } else {
    lead = await store.createLead({
      ...common,
      token: newToken(),
      stage: 0,
      demo_url: null,
      booking: null,
      utm: input.utm ?? null,
      consent_at: new Date().toISOString(),
    });
    await store.addEvent(lead.id, "lead_created", { priority: d.key, intensity: d.intensity });
  }
  return { lead, redo };
}

/** Envois d’e-mails après création (à lancer hors du chemin critique de la réponse). */
export async function notifyNewLead(lead: Lead, redo: boolean) {
  const results = await Promise.allSettled([sendDiagnosticReady(lead), sendNewLeadToAgency(lead, redo)]);
  for (const r of results) if (r.status === "rejected") console.error("[email] échec", r.reason);
}

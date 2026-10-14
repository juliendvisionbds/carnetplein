import { PRICING } from "@/lib/content";
import { diagnose, formatAnswer, profileFor, questions, questionLabel } from "@/lib/diagnostic";
import type { Lead } from "@/lib/store";

/** Synthèse texte téléchargeable par le prospect. */
export function buildReport(lead: Lead): string {
  const d = { ...diagnose(lead.answers), key: lead.priority, secondary: lead.secondary, intensity: lead.intensity };
  const p = profileFor(lead.answers, d);
  return [
    "CARNET PLEIN — MON DIAGNOSTIC",
    "",
    `Nom : ${lead.name}${lead.company ? ` · ${lead.company}` : ""}`,
    ...(lead.trade ? [`Métier : ${lead.trade}`] : []),
    `Priorité : ${p.tag}`,
    "",
    p.title,
    p.intro,
    "",
    "MES TROIS ACTIONS",
    ...p.actions.map((a, i) => `${i + 1}. ${a[0]} — ${a[1]}`),
    "",
    "MES RÉPONSES",
    ...questions.map((q) => `${questionLabel(q)} : ${formatAnswer(lead.answers, q.id)}`),
    "",
    "Diagnostic indicatif fondé sur mes réponses, sans garantie de résultat.",
    `Démo gratuite. Installation ${PRICING.setup} puis ${PRICING.monthly}, ${PRICING.footnote.toLowerCase()}.`,
  ].join("\n");
}

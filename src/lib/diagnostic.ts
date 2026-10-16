/**
 * Logique métier du diagnostic Vision.
 * Module pur (aucune dépendance au DOM ni à la base) : utilisé côté client pour
 * le questionnaire et côté serveur pour calculer la priorité au moment de l’enregistrement.
 *
 * Les réponses sont stockées sous forme de clés stables (ex. « next_day »), indépendantes
 * de la langue. Les libellés correspondants vivent dans src/i18n/dictionaries (section « diagnostic »).
 */

import type { DiagnosticDictionary } from "@/i18n";

export type Answers = {
  volume?: string;
  source?: string[];
  conversion?: string;
  response?: string;
  autoConfirm?: boolean;
  qual?: string;
  detail?: string;
  quote?: string;
  follow?: string;
  tracking?: string;
};

export type QuestionId = Exclude<keyof Answers, "autoConfirm">;

export type ProfileKey = "relance" | "reponse" | "qualification" | "devis" | "pilotage" | "acquisition" | "optimisation";

export type ScoredKey = Exclude<ProfileKey, "acquisition" | "optimisation">;

export type Profile = {
  tag: string;
  title: string;
  intro: string;
  actions: [string, string][];
  projection: string[];
};

export type Question = {
  id: QuestionId;
  section: number;
  type?: "single" | "multi";
  /** Clés des options proposées (éventuellement selon les réponses précédentes). */
  opts: string[] | ((a: Answers) => string[]);
  /** Vrai quand la variante « alt » des textes (titre, aide) doit être affichée. */
  alt?: (a: Answers) => boolean;
};

/** Clé commune à toutes les questions pour « je ne sais pas ». */
export const UNKNOWN = "unknown";

export const SECTION_COUNT = 4;

const QUAL_ALL = "all";

export const questions: Question[] = [
  { id: "volume", section: 0, opts: ["lt5", "5_20", "21_50", "gt50", UNKNOWN] },
  { id: "source", section: 0, type: "multi", opts: ["word_of_mouth", "website", "ads", "social", "platforms", "other", UNKNOWN] },
  { id: "conversion", section: 0, opts: ["0_1", "2_3", "4_6", "7_plus", UNKNOWN] },
  { id: "response", section: 1, opts: ["hour", "day", "next_day", "days", UNKNOWN] },
  { id: "qual", section: 1, opts: ["name_only", "partial", QUAL_ALL, UNKNOWN] },
  {
    id: "detail",
    section: 1,
    alt: (a) => a.qual === QUAL_ALL,
    opts: (a) => (a.qual === QUAL_ALL ? ["shared_sheet", "search_messages", "in_head"] : ["budget", "date", "zone", "need", UNKNOWN]),
  },
  { id: "quote", section: 2, opts: ["clear", "several_exchanges", "delayed", UNKNOWN] },
  { id: "follow", section: 2, opts: ["planned", "when_i_think", "once", "never", UNKNOWN] },
  { id: "tracking", section: 2, opts: ["shared_tool", "spreadsheet", "emails_notebook", "in_head", UNKNOWN] },
];

export const MAX_SOURCES = 3;

export function resolveOpts(q: Question, a: Answers): string[] {
  return typeof q.opts === "function" ? q.opts(a) : q.opts;
}

/** Textes d’une question dans la langue donnée (variante « alt » comprise). */
export function questionText(q: Question, a: Answers, t: DiagnosticDictionary): { title: string; help: string } {
  const text = t.questions[q.id];
  const alt = "alt" in text ? text.alt : undefined;
  if (q.alt?.(a) && alt) return alt;
  return { title: text.title, help: text.help };
}

/** Libellé d’une option (la clé brute est renvoyée si elle est inconnue, ex. anciens dossiers). */
export function optionLabel(t: DiagnosticDictionary, id: QuestionId, key: string): string {
  const options = t.questions[id].options as Record<string, string>;
  return options[key] ?? key;
}

/** La première question, prête à afficher dans le hero (accueil, pages métiers) : un clic lance le diagnostic. */
export function firstQuestionCard(t: DiagnosticDictionary) {
  const first = questions[0];
  return {
    section: t.sections[first.section],
    title: t.questions[first.id].title,
    help: t.questions[first.id].help,
    options: resolveOpts(first, {}).map((key) => ({ key, label: optionLabel(t, first.id, key) })),
    total: questions.length + 1,
  };
}

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id];
  const allowed = resolveOpts(q, a);
  if (q.type === "multi") {
    return Array.isArray(v) && v.length > 0 && v.length <= MAX_SOURCES && v.every((x) => allowed.includes(x));
  }
  return typeof v === "string" && allowed.includes(v);
}

export function countUnknown(a: Answers): number {
  return Object.values(a).filter((x) => x === UNKNOWN || (Array.isArray(x) && x.includes(UNKNOWN))).length;
}

/** Ordre de départage en cas d’égalité : la perte la plus directe d’abord. */
const TIE_ORDER: ScoredKey[] = ["relance", "reponse", "qualification", "pilotage", "devis"];

export type Intensity = "forte" | "modérée" | "faible";

export type Diagnosis = {
  key: ProfileKey;
  secondary: ScoredKey | null;
  scores: Record<ScoredKey, number>;
  intensity: Intensity;
  lowVolume: boolean;
  uncertain: boolean;
};

export function scoreAnswers(a: Answers): Record<ScoredKey, number> {
  const s: Record<ScoredKey, number> = { relance: 0, reponse: 0, qualification: 0, pilotage: 0, devis: 0 };

  // Première réponse
  if (a.response === "days") s.reponse = 5;
  else if (a.response === "next_day") s.reponse = 3;
  else if (a.response === UNKNOWN) s.reponse = 1;
  // Des demandes payantes ou partagées (plateformes, publicité) se refroidissent très vite.
  const paidOrShared = (a.source ?? []).some((x) => x === "platforms" || x === "ads");
  if (paidOrShared && a.response && a.response !== "hour") s.reponse += 1;

  // Qualification
  if (a.qual === "name_only") s.qualification = 4;
  else if (a.qual === "partial") s.qualification = 2;

  // Pilotage
  if (a.detail === "search_messages" || a.detail === "in_head") s.pilotage += 2;
  if (a.tracking === "in_head") s.pilotage += 4;
  else if (a.tracking === "emails_notebook") s.pilotage += 3;
  else if (a.tracking === UNKNOWN) s.pilotage += 1;
  if (a.volume === UNKNOWN) s.pilotage += 1;
  if (a.conversion === UNKNOWN) s.pilotage += 2;

  // Devis
  if (a.quote === "delayed") s.devis = 4;
  else if (a.quote === "several_exchanges") s.devis = 2;

  // Relance
  if (a.follow === "never") s.relance = 5;
  else if (a.follow === "when_i_think") s.relance = 4;
  else if (a.follow === "once") s.relance = 3;

  // Conversion très faible : la vitesse et le suivi sont les premiers suspects.
  if (a.conversion === "0_1") {
    s.relance += 1;
    s.reponse += 1;
  }
  return s;
}

export function diagnose(a: Answers): Diagnosis {
  const scores = scoreAnswers(a);
  const ranked = TIE_ORDER.map((k) => [k, scores[k]] as [ScoredKey, number]).sort((x, y) => y[1] - x[1]);
  const [topKey, topScore] = ranked[0];
  const second = ranked[1];
  const lowVolume = a.volume === "lt5";
  const uncertain = countUnknown(a) >= 3;

  let key: ProfileKey;
  if (lowVolume && topScore <= 2) key = "acquisition";
  else if (topScore === 0) key = uncertain ? "pilotage" : "optimisation";
  else key = topKey;

  const secondary = key === topKey && second && second[1] >= 3 ? second[0] : null;
  const intensity: Intensity = topScore >= 4 ? "forte" : topScore >= 2 ? "modérée" : "faible";
  return { key, secondary, scores, intensity, lowVolume, uncertain };
}

/** Profil affiché, avec la variante « confirmation automatique déjà en place ». */
export function profileFor(a: Answers, d: Pick<Diagnosis, "key">, t: DiagnosticDictionary): Profile {
  const p = t.profiles[d.key];
  if (d.key !== "reponse" || !a.autoConfirm) return p;
  const v = t.reponseAutoConfirm;
  return { ...p, title: v.title, intro: v.intro, actions: [v.firstAction, ...p.actions.slice(1)], projection: v.projection };
}

export const EVIDENCE_IDS: Record<ProfileKey, QuestionId[]> = {
  relance: ["follow", "response"],
  reponse: ["response", "tracking"],
  qualification: ["qual", "detail"],
  devis: ["quote", "qual"],
  pilotage: ["tracking", "conversion"],
  acquisition: ["volume", "source"],
  optimisation: ["follow", "tracking"],
};

/** Réponse lisible dans la langue donnée (les clés inconnues sont affichées telles quelles). */
export function formatAnswer(a: Answers, id: QuestionId, t: DiagnosticDictionary): string {
  const v = a[id];
  const text = Array.isArray(v) ? v.map((x) => optionLabel(t, id, x)).join(" · ") : v ? optionLabel(t, id, v) : t.notProvided;
  return id === "response" && a.autoConfirm ? t.autoConfirmPrefix + text : text;
}

export function questionLabel(q: Question, t: DiagnosticDictionary): string {
  return q.id === "detail" ? t.detailLabel : t.questions[q.id].title;
}

/** Valeurs par défaut du simulateur à partir des réponses déclarées. */
export function simulationDefaults(a: Answers): { volume: number; now: number; target: number } {
  const volume = ({ lt5: 4, "5_20": 12, "21_50": 35, gt50: 60 } as Record<string, number>)[a.volume ?? ""] ?? 20;
  const now = ({ "0_1": 10, "2_3": 25, "4_6": 50, "7_plus": 75 } as Record<string, number>)[a.conversion ?? ""] ?? 20;
  return { volume, now, target: Math.min(100, now + 10) };
}

/** Étapes du pipeline commercial (back-office, en français). */
export const STAGES = ["Nouveau", "Démo en préparation", "Démo envoyée", "Rendez-vous pris", "Client signé", "Perdu"] as const;
export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export const STAGE_NEW: Stage = 0, STAGE_PREP: Stage = 1, STAGE_DEMO_SENT: Stage = 2, STAGE_BOOKED: Stage = 3, STAGE_WON: Stage = 4, STAGE_LOST: Stage = 5;

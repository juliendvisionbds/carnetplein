import { fmt, type FollowUpSituation, type TradeKey } from "@/i18n/config";

/**
 * Générateur de relances de devis : assemble l’e-mail, le SMS et la séquence de relance (J+2, J+7, J+21)
 * à partir des modèles de src/i18n/follow-up. Sans dépendance serveur : utilisé par les pages de modèles,
 * par le formulaire (dans le navigateur) et par l’API qui fait réécrire les messages par l’IA.
 */

/** Délai depuis l’envoi du devis, tel que le visiteur le choisit. */
export const FOLLOW_UP_ELAPSED = ["days", "week", "weeks", "month"] as const;
export type FollowUpElapsed = (typeof FOLLOW_UP_ELAPSED)[number];

/** Un métier du site, ou « autre » (modèles génériques). */
export type FollowUpTrade = TradeKey | "other";

/** Ce que les modèles savent d’un métier : morceaux de phrases insérés dans les messages. */
export type TradeCopy = {
  /** « your kitchen project », quand le visiteur ne décrit pas son projet. */
  project: string;
  theDoc: string;
  yourDoc: string;
  /** Les questions qui restent souvent ouvertes après le devis. */
  question: string;
  /** Une prochaine étape concrète à proposer (après « I can… » / « je peux… »). */
  nextStep: string;
  /** Ce que comprend le devis (objection de prix). */
  included: string;
  /** Une option pour réduire le budget sans brader le prix. */
  option: string;
  /** Un créneau à proposer, article compris (« a fitting slot », « une date de démarrage »). */
  slot: string;
  /** Titres des pages de modèles : « a kitchen quote ». */
  aQuote: string;
  /** « kitchen installers » : descriptions des pages de modèles. */
  audience: string;
  /** Ce qui se joue pour ce métier dans chaque situation (pages de modèles). */
  insights: Record<FollowUpSituation, string>;
};

/** Une relance : quand, par quel canal, dans quel but, et les messages (variables {client}, {project}…). */
export type StepCopy = { when: string; channel: string; goal: string; subject: string; email: string; sms: string; smsFirst?: boolean };

export type SituationCopy = {
  label: string;
  hint: string;
  steps: [StepCopy, StepCopy, StepCopy];
  /** Relance d’un devis dormant (un mois ou plus), sauf pour un projet reporté, dont la séquence va jusqu’à la nouvelle date. */
  revive?: StepCopy;
  /** Page de modèles : titre ({aQuote}), description ({audience}), explication et conseils. */
  h1: string;
  description: string;
  why: string;
  tips: string[];
};

export type FollowUpCopy = {
  placeholders: { client: string; sender: string; company: string };
  signature: string;
  trades: Record<FollowUpTrade, TradeCopy>;
  situations: Record<FollowUpSituation, SituationCopy>;
};

export type FollowUpInput = {
  trade: FollowUpTrade;
  situation: FollowUpSituation;
  elapsed: FollowUpElapsed;
  client?: string;
  sender?: string;
  company?: string;
  project?: string;
};

export type FollowUpMessage = { subject: string; body: string; sms: string };
/** smsFirst : le SMS est le premier message conseillé (il passe avant l’e-mail à l’affichage). */
export type FollowUpStep = { when: string; channel: string; goal: string; smsFirst: boolean; message: FollowUpMessage; status: "done" | "current" | "next" };
export type FollowUpResult = {
  /** La relance à envoyer maintenant. */
  current: FollowUpStep;
  /** Les trois relances de la séquence, la relance courante comprise (sauf devis dormant). */
  sequence: FollowUpStep[];
  /** Devis dormant : la séquence est passée, la relance courante est une relance de réactivation. */
  revive: boolean;
};

/** Relance à envoyer selon le délai : index dans la séquence, ou réactivation d’un devis dormant. */
const STEP_FOR: Record<FollowUpSituation, Record<FollowUpElapsed, 0 | 1 | 2 | "revive">> = {
  silence: { days: 0, week: 1, weeks: 2, month: "revive" },
  thinking: { days: 0, week: 1, weeks: 2, month: "revive" },
  price: { days: 0, week: 1, weeks: 2, month: "revive" },
  // Un projet reporté suit la date donnée par le client : la troisième relance prépare la reprise.
  postponed: { days: 0, week: 0, weeks: 1, month: 2 },
};

/** Majuscule en début de phrase, de ligne ou de puce, une fois les variables insérées (« your quote is… » → « Your quote is… »). */
function capitalizeSentences(text: string) {
  return text.replace(/(^|[.!?]\s+|\n[ \t]*(?:-\s+)?)(\p{Ll})/gu, (_, before: string, letter: string) => before + letter.toUpperCase());
}

/** Champ libre nettoyé : espaces superflus retirés, vide si rien d’utile. */
function clean(value: string | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

/** Prénom saisi en minuscules : « claire » → « Claire ». */
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** « de Cuisines Martin », mais « d'Atelier Martin » : élision devant une voyelle ou un h. */
function deCompany(company: string) {
  return /^[aeiouyhàâäéèêëîïôöùûü]/i.test(company) ? `d'${company}` : `de ${company}`;
}

export function tradeCopy(copy: FollowUpCopy, trade: FollowUpTrade) {
  return copy.trades[trade];
}

/** Variables des modèles : morceaux du métier, puis ce que le visiteur a saisi (ou un repère entre crochets). */
function variables(copy: FollowUpCopy, input: FollowUpInput): Record<string, string> {
  const { insights: _insights, ...trade } = tradeCopy(copy, input.trade);
  const client = capitalize(clean(input.client)) || copy.placeholders.client;
  const sender = capitalize(clean(input.sender)) || copy.placeholders.sender;
  const company = clean(input.company) || copy.placeholders.company;
  return {
    ...trade,
    project: clean(input.project) || trade.project,
    client,
    sender,
    company,
    deCompany: deCompany(company),
    signature: fmt(copy.signature, { sender, company }),
  };
}

function renderStep(step: StepCopy, vars: Record<string, string>, status: FollowUpStep["status"]): FollowUpStep {
  const fill = (text: string) => capitalizeSentences(fmt(text, vars));
  return {
    when: step.when,
    channel: step.channel,
    goal: step.goal,
    smsFirst: step.smsFirst ?? false,
    message: { subject: fill(step.subject), body: fill(step.email), sms: fill(step.sms) },
    status,
  };
}

export function buildFollowUp(copy: FollowUpCopy, input: FollowUpInput): FollowUpResult {
  const situation = copy.situations[input.situation];
  const vars = variables(copy, input);
  const at = STEP_FOR[input.situation][input.elapsed];
  const revive = at === "revive" && situation.revive !== undefined;
  const currentIndex = revive ? situation.steps.length : at === "revive" ? 2 : at;
  const sequence = situation.steps.map((step, i) => renderStep(step, vars, i < currentIndex ? "done" : i === currentIndex ? "current" : "next"));
  const current = revive && situation.revive ? renderStep(situation.revive, vars, "current") : sequence[currentIndex];
  return { current, sequence, revive };
}

/** Texte découpé en morceaux, les repères à compléter (« [date] ») mis à part pour être surlignés. */
export function splitPlaceholders(text: string): { text: string; placeholder: boolean }[] {
  return text
    .split(/(\[[^\]\n]{1,40}\])/g)
    .filter(Boolean)
    .map((part) => ({ text: part, placeholder: /^\[[^\]\n]+\]$/.test(part) }));
}

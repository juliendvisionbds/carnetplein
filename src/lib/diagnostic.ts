/**
 * Logique métier du diagnostic Carnet Plein.
 * Module pur (aucune dépendance au DOM ni à la base) : utilisé côté client pour
 * l'aperçu et côté serveur pour calculer la priorité au moment de l'enregistrement.
 */

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

export type ProfileKey =
  | "relance"
  | "reponse"
  | "qualification"
  | "devis"
  | "pilotage"
  | "acquisition"
  | "optimisation";

export type ScoredKey = Exclude<ProfileKey, "acquisition" | "optimisation">;

export type Profile = {
  tag: string;
  title: string;
  intro: string;
  actions: [string, string][];
  projection: string[];
};

export type Question = {
  id: keyof Answers;
  section: number;
  title: string | ((a: Answers) => string);
  help: string | ((a: Answers) => string);
  type?: "single" | "multi";
  opts: string[] | ((a: Answers) => string[]);
};

export const SECTIONS = ["Votre activité", "La prise de contact", "Le suivi commercial", "Vos coordonnées"];

export const profiles: Record<ProfileKey, Profile> = {
  relance: {
    tag: "Suivi des devis",
    title: "Vos devis méritent une deuxième conversation.",
    intro:
      "Vous avez déjà fait une partie du travail. Un suivi régulier aide vos prospects à décider et vous permet de comprendre leurs hésitations.",
    actions: [
      ["Reprendre les devis sans réponse", "Distinguez les projets en réflexion, les projets perdus et ceux à rappeler."],
      ["Préparer trois relances utiles", "Demandez ce qui bloque, apportez une réponse, puis proposez une prochaine étape."],
      ["Donner une date à chaque prochaine action", "Chaque devis ouvert doit avoir un responsable et une date de suivi."],
    ],
    projection: [
      "Demande qualifiée",
      "Devis envoyé et prochaine étape convenue",
      "Relance adaptée à la réponse",
      "Décision enregistrée, dossier à jour",
    ],
  },
  reponse: {
    tag: "Première réponse",
    title: "Le premier contact est votre priorité.",
    intro:
      "Une demande qui attend est une conversation qui ne commence pas. Accusez réception immédiatement, puis donnez un délai clair pour votre réponse personnelle.",
    actions: [
      ["Confirmer chaque demande", "Un message immédiat confirme la réception et annonce la suite."],
      ["Centraliser les demandes entrantes", "Rassemblez formulaire, appels et messages dans une même liste de travail."],
      ["Organiser les rappels", "Attribuez un responsable et un créneau aux demandes à traiter."],
    ],
    projection: [
      "Nouvelle demande reçue",
      "Accusé de réception en moins d’une minute",
      "Résumé du projet et rappel à planifier",
      "Échange personnel puis devis",
    ],
  },
  qualification: {
    tag: "Qualification",
    title: "Mieux comprendre avant de rappeler.",
    intro:
      "Avec peu d’informations au départ, chaque appel recommence de zéro. Quelques questions pertinentes rendent vos échanges plus utiles.",
    actions: [
      ["Poser les bonnes questions", "Précisez le projet, la zone, le calendrier et les contraintes avant le premier échange."],
      ["Adapter la suite à la demande", "Une demande mûre et un projet exploratoire ne nécessitent pas le même suivi."],
      ["Préparer le premier appel", "Rassemblez les réponses dans une fiche claire, disponible en un coup d’œil."],
    ],
    projection: [
      "Questions adaptées à votre métier",
      "Synthèse personnalisée du projet",
      "Proposition de prochaine étape",
      "Premier échange avec le contexte en main",
    ],
  },
  devis: {
    tag: "Préparation du devis",
    title: "Faites avancer le passage au devis.",
    intro:
      "Entre la demande et le devis, les informations dispersées ralentissent votre équipe. Commencez par rendre les dossiers complets et leur avancement visible.",
    actions: [
      ["Définir un dossier prêt à chiffrer", "Listez les informations et les documents nécessaires avant de préparer le devis."],
      ["Repérer les dossiers bloqués", "Rendez visibles les informations manquantes et la personne qui doit agir."],
      ["Annoncer un délai réaliste", "Donnez au prospect une date et prévenez-le en cas de changement."],
    ],
    projection: [
      "Demande et informations regroupées",
      "Pièces manquantes identifiées",
      "Devis préparé par votre équipe",
      "Envoi puis suivi planifié",
    ],
  },
  pilotage: {
    tag: "Visibilité commerciale",
    title: "Une prochaine action pour chaque demande.",
    intro:
      "Vous ne pouvez pas suivre ce qui reste dispersé. Votre première piste est de réunir les demandes et de rendre visibles les actions à mener.",
    actions: [
      ["Rassembler vos projets ouverts", "Une ligne par demande, avec son étape et son interlocuteur."],
      ["Décider qui rappeler et pourquoi", "Chaque matin, affichez les prochaines actions prioritaires."],
      ["Mesurer chaque semaine", "Suivez les demandes, les réponses, les devis envoyés, les signatures et les dossiers en attente."],
    ],
    projection: [
      "Demandes réunies au même endroit",
      "Statut clair pour chaque dossier",
      "Liste des rappels du jour",
      "Bilan hebdomadaire de cinq indicateurs",
    ],
  },
  acquisition: {
    tag: "Volume à vérifier",
    title: "Commencez par vérifier la source des demandes.",
    intro:
      "Vous indiquez recevoir très peu de demandes et votre parcours semble déjà tenu. Un meilleur suivi reste utile, mais il ne crée pas à lui seul un flux suffisant de nouveaux projets.",
    actions: [
      ["Compter les demandes par source", "Sur un mois, notez d’où vient chaque contact et s’il correspond à votre activité."],
      ["Vérifier votre proposition", "Votre site explique-t-il clairement les projets que vous prenez en charge et votre zone ?"],
      ["Sécuriser les demandes existantes", "Répondez et suivez les contacts actuels avant de conclure qu’un outil suffira."],
    ],
    projection: [
      "Origine de la demande identifiée",
      "Projet et zone vérifiés",
      "Réponse et suivi organisés",
      "Décision sur l’acquisition à partir des chiffres",
    ],
  },
  optimisation: {
    tag: "Parcours déjà structuré",
    title: "Votre parcours a déjà de bonnes bases.",
    intro:
      "Vos réponses ne font pas apparaître de rupture évidente. Avant d’ajouter un outil, observez les étapes et les motifs de perte pour cibler une amélioration réelle.",
    actions: [
      ["Mesurer les passages entre étapes", "Comparez demandes, échanges, devis et signatures sur une même période."],
      ["Documenter les refus", "Distinguez budget, calendrier, concurrence et projet abandonné."],
      ["Tester une seule amélioration", "Choisissez une étape et comparez les résultats avant de généraliser."],
    ],
    projection: [
      "Parcours existant conservé",
      "Motifs de perte documentés",
      "Une amélioration testée",
      "Résultats comparés dans le temps",
    ],
  },
};

export const questions: Question[] = [
  {
    id: "volume",
    section: 0,
    title: "Combien de demandes recevez-vous par mois ?",
    help: "Une estimation suffit. On ne vous demande pas un tableau Excel.",
    opts: ["Moins de 5", "5 à 20", "21 à 50", "Plus de 50", "Je ne sais pas"],
  },
  {
    id: "source",
    section: 0,
    title: "D’où viennent principalement ces demandes ?",
    help: "Sélectionnez jusqu’à 3 sources de demandes.",
    type: "multi",
    opts: [
      "Bouche-à-oreille",
      "Site internet / Google",
      "Publicité en ligne",
      "Réseaux sociaux",
      "Plateformes de mise en relation",
      "Autre source",
      "Je ne sais pas",
    ],
  },
  {
    id: "conversion",
    section: 0,
    title: "Sur 10 demandes, combien deviennent des clients ?",
    help: "Il s’agit des demandes reçues, pas seulement des devis envoyés.",
    opts: ["0 à 1", "2 à 3", "4 à 6", "7 ou plus", "Je ne sais pas"],
  },
  {
    id: "response",
    section: 1,
    title: "Quand vous recevez une demande, combien de temps mettez-vous à répondre ?",
    help: "Indiquez votre délai de réponse personnelle. Vous pouvez aussi préciser si un e-mail automatique est envoyé.",
    opts: [
      "Je réponds en moins d’une heure",
      "Je réponds dans la journée",
      "Je réponds le lendemain",
      "Je réponds après plusieurs jours",
      "Cela dépend / je ne sais pas",
    ],
  },
  {
    id: "qual",
    section: 1,
    title: "Avant le premier appel, que savez-vous du projet ?",
    help: "Plus le contexte est clair, plus votre échange peut être concret.",
    opts: [
      "Seulement le nom et le téléphone",
      "Quelques informations, souvent incomplètes",
      "Toutes les informations dont j’ai besoin",
      "Cela dépend / je ne sais pas",
    ],
  },
  {
    id: "detail",
    section: 1,
    title: (a) =>
      a.qual === "Toutes les informations dont j’ai besoin"
        ? "Comment utilisez-vous ces informations ?"
        : "Quelle information vous manque le plus souvent ?",
    help: (a) =>
      a.qual === "Toutes les informations dont j’ai besoin"
        ? "Vérifions si ces informations sont accessibles au bon moment."
        : "Cette réponse servira à personnaliser la prise de contact.",
    opts: (a) =>
      a.qual === "Toutes les informations dont j’ai besoin"
        ? ["Tout est dans une fiche partagée", "Je dois chercher dans mes messages", "Je garde les informations en tête"]
        : ["Le budget envisagé", "La date souhaitée", "La zone et les contraintes techniques", "Le besoin précis", "Je ne sais pas"],
  },
  {
    id: "quote",
    section: 2,
    title: "Comment passez-vous de la demande au devis ?",
    help: "Choisissez la situation qui ressemble le plus à votre quotidien.",
    opts: [
      "Processus clair, informations réunies",
      "Plusieurs échanges pour réunir les informations",
      "Devis souvent retardés faute de temps",
      "Cela dépend / je ne sais pas",
    ],
  },
  {
    id: "follow",
    section: 2,
    title: "Un devis reste sans réponse. Que se passe-t-il ?",
    help: "C’est souvent là que la conversation s’arrête, même quand le projet continue.",
    opts: ["Relances planifiées, jusqu’à une décision", "Je relance quand j’y pense", "Une relance, puis plus rien", "Je ne relance pas", "Je ne sais pas"],
  },
  {
    id: "tracking",
    section: 2,
    title: "Où suivez-vous les demandes en cours ?",
    help: "Quel outil utilisez-vous pour retrouver vos prospects, leurs échanges et l’avancement de leur projet ?",
    opts: [
      "Outil partagé avec statuts et prochaines actions",
      "Tableur tenu à jour",
      "E-mails, messages et carnet",
      "Principalement dans ma tête",
      "Je ne sais pas",
    ],
  },
];

export function resolve<T>(v: T | ((a: Answers) => T), a: Answers): T {
  return typeof v === "function" ? (v as (a: Answers) => T)(a) : v;
}

export function isAnswered(q: Question, a: Answers): boolean {
  const v = a[q.id];
  if (q.type === "multi") return Array.isArray(v) && v.length > 0 && v.length <= 3;
  return typeof v === "string" && v.trim().length > 0;
}

export function countUnknown(a: Answers): number {
  return Object.values(a).filter((x) => String(x).includes("sais pas")).length;
}

/** Ordre de départage en cas d’égalité : la perte la plus directe d’abord. */
const TIE_ORDER: ScoredKey[] = ["relance", "reponse", "qualification", "pilotage", "devis"];

export type Diagnosis = {
  key: ProfileKey;
  secondary: ScoredKey | null;
  scores: Record<ScoredKey, number>;
  intensity: "forte" | "modérée" | "faible";
  lowVolume: boolean;
  uncertain: boolean;
};

export function scoreAnswers(a: Answers): Record<ScoredKey, number> {
  const s: Record<ScoredKey, number> = { relance: 0, reponse: 0, qualification: 0, pilotage: 0, devis: 0 };

  // Première réponse
  if (a.response === "Je réponds après plusieurs jours") s.reponse = 5;
  else if (a.response === "Je réponds le lendemain") s.reponse = 3;
  else if (a.response === "Cela dépend / je ne sais pas") s.reponse = 1;
  // Des demandes payantes ou partagées (plateformes, publicité) se refroidissent très vite.
  const paidOrShared = (a.source ?? []).some((x) => x === "Plateformes de mise en relation" || x === "Publicité en ligne");
  if (paidOrShared && a.response && a.response !== "Je réponds en moins d’une heure") s.reponse += 1;

  // Qualification
  if (a.qual === "Seulement le nom et le téléphone") s.qualification = 4;
  else if (a.qual === "Quelques informations, souvent incomplètes") s.qualification = 2;

  // Pilotage
  if (a.detail === "Je dois chercher dans mes messages" || a.detail === "Je garde les informations en tête") s.pilotage += 2;
  if (a.tracking === "Principalement dans ma tête") s.pilotage += 4;
  else if (a.tracking === "E-mails, messages et carnet") s.pilotage += 3;
  else if (a.tracking === "Je ne sais pas") s.pilotage += 1;
  if (a.volume === "Je ne sais pas") s.pilotage += 1;
  if (a.conversion === "Je ne sais pas") s.pilotage += 2;

  // Devis
  if (a.quote === "Devis souvent retardés faute de temps") s.devis = 4;
  else if (a.quote === "Plusieurs échanges pour réunir les informations") s.devis = 2;

  // Relance
  if (a.follow === "Je ne relance pas") s.relance = 5;
  else if (a.follow === "Je relance quand j’y pense") s.relance = 4;
  else if (a.follow === "Une relance, puis plus rien") s.relance = 3;

  // Conversion très faible : la vitesse et le suivi sont les premiers suspects.
  if (a.conversion === "0 à 1") {
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
  const lowVolume = a.volume === "Moins de 5";
  const uncertain = countUnknown(a) >= 3;

  let key: ProfileKey;
  if (lowVolume && topScore <= 2) key = "acquisition";
  else if (topScore === 0) key = uncertain ? "pilotage" : "optimisation";
  else key = topKey;

  const secondary = key === topKey && second && second[1] >= 3 ? second[0] : null;
  const intensity: Diagnosis["intensity"] = topScore >= 4 ? "forte" : topScore >= 2 ? "modérée" : "faible";
  return { key, secondary, scores, intensity, lowVolume, uncertain };
}

/** Profil affiché, avec la variante « confirmation automatique déjà en place ». */
export function profileFor(a: Answers, d: Diagnosis = diagnose(a)): Profile {
  const p = profiles[d.key];
  if (d.key !== "reponse" || !a.autoConfirm) return p;
  return {
    ...p,
    title: "Après la confirmation, faites avancer l’échange.",
    intro:
      "Votre e-mail automatique confirme déjà la réception. La priorité est maintenant de réduire l’attente avant votre réponse personnelle.",
    actions: [
      ["Annoncer le délai de réponse personnelle", "Votre confirmation peut préciser quand le prospect sera recontacté."],
      ...p.actions.slice(1),
    ] as [string, string][],
    projection: [
      "Nouvelle demande reçue",
      "Confirmation automatique déjà en place",
      "Rappel personnel à planifier rapidement",
      "Échange sur le projet puis devis",
    ],
  };
}

export const EVIDENCE_IDS: Record<ProfileKey, (keyof Answers)[]> = {
  relance: ["follow", "response"],
  reponse: ["response", "tracking"],
  qualification: ["qual", "detail"],
  devis: ["quote", "qual"],
  pilotage: ["tracking", "conversion"],
  acquisition: ["volume", "source"],
  optimisation: ["follow", "tracking"],
};

export const EVIDENCE_LABELS: Record<string, string> = {
  follow: "Votre suivi des devis",
  response: "Votre délai de réponse",
  tracking: "Votre outil de suivi",
  qual: "Les informations au premier contact",
  detail: "Votre précision",
  quote: "Votre préparation des devis",
  conversion: "Vos signatures déclarées",
  volume: "Votre volume mensuel",
  source: "Vos sources de demandes",
};

export function formatAnswer(a: Answers, id: keyof Answers): string {
  const v = a[id];
  const text = Array.isArray(v) ? v.join(" · ") : String(v ?? "Non renseigné");
  return id === "response" && a.autoConfirm ? "E-mail de confirmation automatique envoyé immédiatement. " + text : text;
}

export function questionLabel(q: Question): string {
  return q.id === "detail" ? "Précision sur la qualification" : typeof q.title === "string" ? q.title : q.id;
}

/** Valeurs par défaut du simulateur à partir des réponses déclarées. */
export function simulationDefaults(a: Answers): { volume: number; now: number; target: number } {
  const volume = { "Moins de 5": 4, "5 à 20": 12, "21 à 50": 35, "Plus de 50": 60 }[a.volume ?? ""] ?? 20;
  const now = { "0 à 1": 10, "2 à 3": 25, "4 à 6": 50, "7 ou plus": 75 }[a.conversion ?? ""] ?? 20;
  return { volume, now, target: Math.min(100, now + 10) };
}

export const SECONDARY_HINT: Record<ScoredKey, string> = {
  relance: "vos devis sans réponse restent souvent sans relance",
  reponse: "votre délai de première réponse laisse attendre le prospect",
  qualification: "vous démarrez souvent vos appels sans le contexte du projet",
  pilotage: "vos demandes en cours ne sont pas réunies au même endroit",
  devis: "le passage de la demande au devis prend du temps",
};

/** Étapes du pipeline commercial (back-office). */
export const STAGES = ["Nouveau", "Démo en préparation", "Démo envoyée", "Rendez-vous pris", "Client signé", "Perdu"] as const;
export type Stage = 0 | 1 | 2 | 3 | 4 | 5;
export const STAGE_NEW: Stage = 0, STAGE_PREP: Stage = 1, STAGE_DEMO_SENT: Stage = 2, STAGE_BOOKED: Stage = 3, STAGE_WON: Stage = 4, STAGE_LOST: Stage = 5;

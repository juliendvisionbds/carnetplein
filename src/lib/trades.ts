/**
 * Métiers reconnus : détection par mots-clés (depuis le site du prospect ou un libellé
 * saisi dans le pilotage) et aperçu « côté client » associé.
 */

export type TradePrompt = { title: string; question: string; options: string[] };

export type Trade = { label: string; match: RegExp; prompt: TradePrompt };

export const TRADES: Trade[] = [
  {
    label: "Cuisines & agencement",
    match: /cuisin|agencement|dressing|placard/i,
    prompt: { title: "Votre nouvelle cuisine commence ici.", question: "Quel est votre projet ?", options: ["Rénover une cuisine existante", "Créer une cuisine dans un nouveau logement", "Repenser les rangements"] },
  },
  {
    label: "Solaire résidentiel",
    match: /solaire|photovolta|panneaux? solaire|autoconsommation/i,
    prompt: { title: "Votre maison a-t-elle un projet solaire ?", question: "Qu’est-ce qui vous motive ?", options: ["Réduire ma facture", "Produire et consommer mon énergie", "Étudier la faisabilité"] },
  },
  {
    label: "Bornes de recharge",
    match: /borne|recharge|irve|wallbox/i,
    prompt: { title: "Préparons votre recharge à domicile.", question: "Où souhaitez-vous installer votre borne ?", options: ["Garage individuel", "Place extérieure privée", "Parking de copropriété"] },
  },
  {
    label: "Rénovation & façades",
    match: /fa[çc]ade|ravalement|r[ée]novation|ma[çc]onnerie|isolation|toiture|couvreur|peinture/i,
    prompt: { title: "Redonnons du caractère à votre façade.", question: "Quel est l’état de votre façade ?", options: ["Peinture vieillissante", "Fissures ou dégradations", "Besoin d’un avis sur place"] },
  },
  {
    label: "Déménagement",
    match: /d[ée]m[ée]nag|garde-?meuble/i,
    prompt: { title: "Votre déménagement, bien préparé.", question: "Quel logement quittez-vous ?", options: ["Un appartement", "Une maison", "Un autre type de logement"] },
  },
  {
    label: "Wedding planner",
    match: /mariage|wedding|[ée]v[ée]nementiel|c[ée]r[ée]monie/i,
    prompt: { title: "Commençons à imaginer votre mariage.", question: "Où en êtes-vous de votre projet ?", options: ["Nous commençons tout juste", "Nous avons la date et le lieu", "Nous cherchons une coordination"] },
  },
  {
    label: "Saunas & bien-être",
    match: /sauna|hammam|spa\b|bien-?[êe]tre|jacuzzi|baln[ée]o/i,
    prompt: { title: "Votre espace bien-être prend forme.", question: "Où imaginez-vous votre sauna ?", options: ["À l’intérieur", "Dans le jardin", "Le lieu reste à définir"] },
  },
  {
    label: "Piscines",
    match: /piscine|pisciniste|bassin/i,
    prompt: { title: "Votre piscine, pensée pour votre jardin.", question: "Quel est votre projet ?", options: ["Construire une piscine", "Rénover un bassin existant", "Ajouter un abri ou un équipement"] },
  },
  {
    label: "Paysagiste",
    match: /paysag|jardin|terrasse|cl[ôo]ture|espaces? verts?/i,
    prompt: { title: "Votre extérieur mérite un projet.", question: "Par quoi commencer ?", options: ["Créer ou refaire un jardin", "Une terrasse ou un aménagement", "Un entretien régulier"] },
  },
  {
    label: "Salles de bains & plomberie",
    match: /salle[s]? de bain|plomb|sanitaire|douche/i,
    prompt: { title: "Votre salle de bains, repensée.", question: "Quel est votre projet ?", options: ["Rénover entièrement", "Remplacer la douche ou la baignoire", "Adapter pour l’accessibilité"] },
  },
  {
    label: "Menuiserie & fermetures",
    match: /menuis|fen[êe]tre|volet|porte|v[ée]randa|pergola|store/i,
    prompt: { title: "Vos ouvertures, à la mesure de votre maison.", question: "Quel est votre projet ?", options: ["Remplacer des fenêtres ou volets", "Une véranda ou une pergola", "Une porte d’entrée ou de garage"] },
  },
  {
    label: "Chauffage & climatisation",
    match: /chauffag|pompe [àa] chaleur|climatis|chaudi[èe]re|plombier-?chauffagiste/i,
    prompt: { title: "Votre confort, toute l’année.", question: "Qu’est-ce qui vous amène ?", options: ["Remplacer mon système de chauffage", "Installer une climatisation", "Étudier une pompe à chaleur"] },
  },
  {
    label: "Électricité",
    match: /[ée]lectri|domotique|tableau [ée]lectrique/i,
    prompt: { title: "Une installation électrique sereine.", question: "Quel est votre besoin ?", options: ["Rénover l’installation", "Ajouter des équipements", "Un diagnostic ou une mise aux normes"] },
  },
  {
    label: "Architecte & maîtrise d’œuvre",
    match: /architect|ma[îi]trise d.?[œo]uvre|extension|sur[ée]l[ée]vation/i,
    prompt: { title: "Votre projet, dessiné pour vous.", question: "Où en êtes-vous ?", options: ["J’ai une idée, pas encore de plan", "J’ai des plans à faire évoluer", "Je cherche un suivi de chantier"] },
  },
];

export const FALLBACK_PROMPT: TradePrompt = {
  title: "Parlons de votre prochain projet.",
  question: "Où en êtes-vous ?",
  options: ["Je découvre les possibilités", "Mon besoin est déjà précis", "Je souhaite être conseillé"],
};

/** Devine un métier à partir d’un texte (titre et description du site, URL…). */
export function guessTrade(text: string): string | null {
  const t = text.toLowerCase();
  let best: { label: string; score: number } | null = null;
  for (const trade of TRADES) {
    const matches = t.match(new RegExp(trade.match.source, "gi"));
    const score = matches?.length ?? 0;
    if (score > 0 && (!best || score > best.score)) best = { label: trade.label, score };
  }
  return best?.label ?? null;
}

/** Aperçu « côté client » pour un métier (libellé reconnu ou texte libre). */
export function promptFor(trade: string | null | undefined): TradePrompt {
  if (!trade) return FALLBACK_PROMPT;
  return TRADES.find((t) => t.label === trade)?.prompt ?? TRADES.find((t) => t.match.test(trade))?.prompt ?? FALLBACK_PROMPT;
}

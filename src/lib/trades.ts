/**
 * Métiers reconnus : détection par mots-clés (depuis le site du prospect ou un libellé
 * saisi dans le pilotage), en français et en anglais. Le libellé français est la valeur
 * canonique stockée en base ; l’anglais sert à l’affichage pour les prospects anglophones.
 */

import type { Locale } from "@/i18n/config";

export type Trade = { label: string; en: string; match: RegExp };

export const TRADES: Trade[] = [
  { label: "Cuisines & agencement", en: "Kitchens & fitted furniture", match: /cuisin|agencement|dressing|placard|kitchen|cabinetr|wardrobe|closet/i },
  { label: "Solaire résidentiel", en: "Residential solar", match: /solaire|photovolta|panneaux? solaire|autoconsommation|solar|\bpv\b/i },
  { label: "Bornes de recharge", en: "EV charging stations", match: /borne|recharge|irve|wallbox|ev charg|charging station|charge ?point/i },
  { label: "Rénovation & façades", en: "Renovation & facades", match: /fa[çc]ade|ravalement|r[ée]novation|ma[çc]onnerie|isolation|toiture|couvreur|peinture|renovat|masonry|insulation|roof|painter|painting|plaster/i },
  { label: "Déménagement", en: "Moving services", match: /d[ée]m[ée]nag|garde-?meuble|\bmoving\b|\bmovers?\b|removals?|self.?storage/i },
  { label: "Wedding planner", en: "Wedding planner", match: /mariage|wedding|[ée]v[ée]nementiel|c[ée]r[ée]monie|event plann|ceremony/i },
  { label: "Saunas & bien-être", en: "Saunas & wellness", match: /sauna|hammam|spa\b|bien-?[êe]tre|jacuzzi|baln[ée]o|wellness|hot tub/i },
  { label: "Piscines", en: "Swimming pools", match: /piscine|pisciniste|bassin|swimming pool|pool (builder|construction|install)/i },
  { label: "Paysagiste", en: "Landscaping", match: /paysag|jardin|terrasse|cl[ôo]ture|espaces? verts?|landscap|garden|patio|fenc(e|ing)|lawn/i },
  { label: "Salles de bains & plomberie", en: "Bathrooms & plumbing", match: /salle[s]? de bain|plomb|sanitaire|douche|bathroom|plumb|shower/i },
  { label: "Menuiserie & fermetures", en: "Joinery, windows & doors", match: /menuis|fen[êe]tre|volet|porte|v[ée]randa|pergola|store|joiner|window|shutter|\bdoors?\b|conservator|blinds?/i },
  { label: "Chauffage & climatisation", en: "Heating & air conditioning", match: /chauffag|pompe [àa] chaleur|climatis|chaudi[èe]re|plombier-?chauffagiste|heating|heat pump|air ?condition|hvac|boiler|furnace/i },
  { label: "Électricité", en: "Electrical work", match: /[ée]lectri|domotique|tableau [ée]lectrique|electric|smart home|wiring/i },
  { label: "Architecte & maîtrise d’œuvre", en: "Architect & project management", match: /architect|ma[îi]trise d.?[œo]uvre|extension|sur[ée]l[ée]vation|loft conversion|design.?build/i },
];

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

/** Libellé d’un métier dans la langue demandée (un libellé libre saisi dans le pilotage est renvoyé tel quel). */
export function tradeLabel(trade: string | null | undefined, lang: Locale): string | null {
  if (!trade) return null;
  if (lang === "fr") return trade;
  return TRADES.find((t) => t.label === trade)?.en ?? trade;
}

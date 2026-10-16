/**
 * Paramètres commerciaux et identité, indépendants de la langue.
 * Les textes traduits vivent dans src/i18n/dictionaries.
 */

export const SITE = {
  name: "Vision",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
};

/** Prix affichés dans les deux langues (euros, hors taxes). */
export const PRICE = {
  setup: 970,
  monthly: 490,
};

/** Lien de prise de rendez-vous (Cal.com, Calendly, Google Agenda…). Vide = formulaire interne. */
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || "";

/** Durée de l’appel découverte, en minutes. */
export const CALL_MINUTES = 15;

/**
 * Identité juridique de l’agence, affichée sur les mentions légales (dans les deux langues).
 * Les champs entre crochets sont à compléter.
 */
export const EDITOR = {
  name: "[Raison sociale de l’agence]",
  form: "[Forme juridique, capital social]",
  address: "[Adresse du siège social]",
  registration: "[RCS ville et numéro, ou SIREN]",
  vat: "[Numéro de TVA intracommunautaire]",
  email: "[Adresse e-mail de contact]",
  director: "[Nom du directeur ou de la directrice de la publication]",
};

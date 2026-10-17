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
 * Faits sur l’entreprise, repris par la page À propos (tableau « Key facts ») et ses données structurées.
 * Les champs à null ne sont pas affichés : à compléter dès que les chiffres sont publiables.
 */
export const COMPANY = {
  /** Année de lancement de Vision par l’équipe VisionBTP. */
  founded: 2026,
  /** Siège (même équipe et même implantation que VisionBTP) : affiché « Var (83), France ». */
  region: "Var",
  department: "83",
  country: "France",
  countryCode: "FR",
  /** Le studio qui construit Vision (lien du pied de page). */
  builtBy: { name: "VisionBTP", url: "https://www.visionbtp.com", founded: 2025 },
  notableClients: null as string | null,
  customersServed: null as string | null,
  projectsDelivered: null as string | null,
};

/**
 * L’équipe de Vision (page Équipe, page À propos, données structurées).
 * Les rôles et biographies traduits vivent dans la section « team » des dictionnaires, sous la même clé.
 */
export const TEAM = [
  { key: "julien", name: "Julien Devoir", photo: "/team/julien.jpg", linkedin: "https://www.linkedin.com/in/juliendevoir/" },
  { key: "clement", name: "Clément Bernard", photo: "/team/clement.jpg", linkedin: "https://www.linkedin.com/in/clementbernard-/" },
] as const;
export type TeamMemberKey = (typeof TEAM)[number]["key"];

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

/**
 * Textes et paramètres commerciaux centralisés.
 * Modifiez ici les prix, la phrase « méta » et les coordonnées de l’agence.
 */

export const SITE = {
  name: "Carnet Plein",
  tagline: "Moins de demandes oubliées. Plus de projets signés.",
  description:
    "Découvrez où vos demandes de devis se perdent. Carnet Plein installe votre parcours de conversion et suit vos prospects jusqu’à leur décision.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000",
};

export const PRICING = {
  setup: "970 € HT",
  monthly: "490 € HT/mois",
  footnote: "Sans engagement de durée",
};

/** Lien de prise de rendez-vous (Cal.com, Calendly, Google Agenda…). Vide = formulaire interne. */
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL?.trim() || "";

export const CALL = {
  duration: "15 minutes",
  title: "Réserver mon appel de 15 min",
};

/** Délai annoncé au prospect pour recevoir la démo complète de son tunnel de vente. */
export const DEMO_DELAY = "sous 2 à 3 jours ouvrés";

/**
 * Le moment « méta » : le prospect vient de vivre exactement ce que ses propres
 * clients vivront. À afficher en grand, après le diagnostic.
 */
export const META = {
  eyebrow: "Plot twist",
  title: "Vous étiez le client depuis le début.",
  body:
    "Les bonnes questions, une réponse immédiate, une page à votre nom, un suivi jusqu’au rendez-vous… ce n’est pas notre site. C’est notre produit. Vous venez de traverser, de l’intérieur, le tunnel de vente qu’on va construire pour vos prospects.",
  punchline: "Inception, version devis.",
};

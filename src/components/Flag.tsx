import type { Locale } from "@/i18n/config";

/**
 * Drapeau d’une langue, en SVG plutôt qu’en emoji : les emojis de drapeaux ne s’affichent pas
 * sous Windows (deux lettres à la place). Format 3:2, l’Union Jack étant recadré sur les côtés.
 */
export function Flag({ lang }: { lang: Locale }) {
  if (lang === "fr") {
    return (
      <svg viewBox="0 0 3 2" width="21" height="14" aria-hidden="true">
        <rect width="1" height="2" fill="#002654" />
        <rect x="1" width="1" height="2" fill="#fff" />
        <rect x="2" width="1" height="2" fill="#ce1126" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" width="21" height="14" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <clipPath id="flag-gb-diagonals">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-gb-diagonals)" stroke="#c8102e" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
    </svg>
  );
}

import type { FollowUpCopy } from "@/lib/follow-up";
import type { Locale } from "@/i18n/config";
import { followUpEn } from "./en";
import { followUpFr } from "./fr";

/** Modèles de relance de devis d’une langue (générateur et pages de modèles). */
export function getFollowUpCopy(lang: Locale): FollowUpCopy {
  return lang === "fr" ? followUpFr : followUpEn;
}

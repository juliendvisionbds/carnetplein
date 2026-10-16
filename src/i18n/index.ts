import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { DEFAULT_LOCALE, hasLocale, type Locale } from "./config";

export * from "./config";

/** Forme commune des dictionnaires, définie par le dictionnaire anglais. */
export type Dictionary = typeof en;
export type DiagnosticDictionary = Dictionary["diagnostic"];

const dictionaries: Record<Locale, Dictionary> = { en, fr };

/** Dictionnaire d’une langue. Une langue inconnue renvoie l’anglais (page 404, par exemple). */
export function getDictionary(lang: string | undefined): Dictionary {
  return dictionaries[hasLocale(lang) ? lang : DEFAULT_LOCALE];
}

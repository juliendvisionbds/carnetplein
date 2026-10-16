import type { Metadata } from "next";
import { SITE } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { OG_LOCALE, localePath, otherLocale, pagePath, type Locale, type LocalizedPage } from "@/i18n/config";

/** Une page publique : adresse fixe (identique dans les deux langues) ou page à segment traduit. */
export type PageRef = { path: string } | { page: LocalizedPage };

export function pathFor(lang: Locale, ref: PageRef): string {
  return "page" in ref ? pagePath(lang, ref.page) : localePath(lang, ref.path);
}

type PageText = { title: string; description: string; absoluteTitle?: boolean };

/**
 * Métadonnées d’une page publique : canonique, hreflang (en, fr, x-default) et Open Graph.
 * Les adresses sont relatives, résolues par metadataBase (défini dans le layout racine).
 */
export function pageMetadata(lang: Locale, ref: PageRef, { title, description, absoluteTitle }: PageText): Metadata {
  const canonical = pathFor(lang, ref);
  const enPath = pathFor("en", ref);
  const frPath = pathFor("fr", ref);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical,
      languages: { en: enPath, fr: frPath, "x-default": enPath },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      type: "website",
      locale: OG_LOCALE[lang],
      alternateLocale: [OG_LOCALE[otherLocale(lang)]],
    },
  };
}

/** Métadonnées par défaut du layout racine (titre, gabarit, description, Open Graph). */
export function rootMetadata(lang: Locale): Metadata {
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE.url),
    title: { default: t.meta.title, template: `%s · ${SITE.name}` },
    description: t.meta.description,
    openGraph: {
      title: t.meta.title,
      description: t.meta.description,
      type: "website",
      siteName: SITE.name,
      locale: OG_LOCALE[lang],
      alternateLocale: [OG_LOCALE[otherLocale(lang)]],
    },
  };
}

import type { Metadata } from "next";
import { PRICE, SITE } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { OG_LOCALE, fmt, localePath, otherLocale, pagePath, type Locale, type LocalizedPage } from "@/i18n/config";

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

/**
 * Données structurées de l’accueil (JSON-LD schema.org) : l’organisation, le site, le service
 * et ses tarifs, et la FAQ affichée sur la page. Adresses absolues, dans la langue de la page.
 */
export function homeStructuredData(lang: Locale) {
  const t = getDictionary(lang);
  const abs = (path: string) => (path === "/" ? SITE.url : `${SITE.url}${path}`);
  const home = abs(localePath(lang, "/"));
  const id = (fragment: string) => `${SITE.url}${localePath(lang, "/")}#${fragment}`;
  const org = { "@id": `${SITE.url}/#organization` };
  const price = (amount: number, extra: object = {}) => ({ "@type": "UnitPriceSpecification", price: amount, priceCurrency: "EUR", valueAddedTaxIncluded: false, ...extra });
  const answer = (text: string) => ({ "@type": "Answer", text });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        ...org,
        name: SITE.name,
        url: SITE.url,
        logo: { "@type": "ImageObject", url: `${SITE.url}/apple-icon`, width: 180, height: 180 },
        description: t.meta.tagline,
      },
      { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: SITE.name, inLanguage: lang, publisher: org },
      {
        "@type": "Service",
        "@id": id("service"),
        name: t.meta.title,
        serviceType: t.meta.serviceType,
        description: t.meta.description,
        url: home,
        provider: org,
        audience: { "@type": "BusinessAudience", name: t.home.eyebrow },
        offers: [
          { "@type": "Offer", name: t.diagnosticPage.title, url: abs(localePath(lang, "/diagnostic")), price: 0, priceCurrency: "EUR" },
          { "@type": "Offer", priceSpecification: [price(PRICE.setup), price(PRICE.monthly, { unitCode: "MON", billingDuration: "P1M" })] },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": id("faq"),
        inLanguage: lang,
        mainEntity: [
          ...t.home.faq.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: answer(fmt(a, { setup: t.pricing.setup, monthly: t.pricing.monthly, footnote: t.pricing.footnote.toLowerCase() })),
          })),
          { "@type": "Question", name: t.home.faqPrivacyQ, acceptedAnswer: answer(`${t.home.faqPrivacyA} ${t.home.faqPrivacyLink} (${abs(pagePath(lang, "privacy"))}).`) },
        ],
      },
    ],
  };
}

/** Balise <script> JSON-LD : « < » est échappé pour qu’aucun texte ne puisse fermer la balise. */
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
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

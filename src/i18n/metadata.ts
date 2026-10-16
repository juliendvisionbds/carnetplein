import type { Metadata } from "next";
import { PRICE, SITE } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { OG_LOCALE, TRADE_KEYS, fmt, localePath, otherLocale, pagePath, tradePath, type Locale, type LocalizedPage, type TradeKey } from "@/i18n/config";

/** Une page publique : adresse fixe (identique dans les deux langues), page à segment traduit ou page métier. */
export type PageRef = { path: string } | { page: LocalizedPage } | { trade: TradeKey };

export function pathFor(lang: Locale, ref: PageRef): string {
  if ("trade" in ref) return tradePath(lang, ref.trade);
  return "page" in ref ? pagePath(lang, ref.page) : localePath(lang, ref.path);
}

/** Adresse absolue, de même forme que la balise canonique : la racine sans barre oblique finale. */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE.url : `${SITE.url}${path}`;
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
      // L’image générée par app/[lang]/opengraph-image.tsx : sans cela, ce bloc openGraph remplace
      // celui hérité du segment [lang] et les pages imbriquées perdent leur image de partage.
      images: [{ url: `/${lang}/opengraph-image/default`, width: 1200, height: 630, alt: getDictionary(lang).meta.title }],
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

/** Fil d’Ariane schema.org : accueil, puis chaque niveau jusqu’à la page courante. */
function breadcrumbList(lang: Locale, items: { name: string; path: string }[]) {
  const t = getDictionary(lang);
  const trail = [{ name: t.trades.crumbHome, path: localePath(lang, "/") }, ...items];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, i) => ({ "@type": "ListItem", position: i + 1, name, item: absoluteUrl(path) })),
  };
}

/** Données structurées de la page des métiers : fil d’Ariane et liste des pages métiers. */
export function tradesIndexStructuredData(lang: Locale) {
  const t = getDictionary(lang).trades;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [{ name: t.index.crumb, path: pagePath(lang, "trades") }]),
      {
        "@type": "ItemList",
        itemListElement: TRADE_KEYS.map((trade, i) => ({ "@type": "ListItem", position: i + 1, name: t.pages[trade].name, url: absoluteUrl(tradePath(lang, trade)) })),
      },
    ],
  };
}

/** Données structurées d’une page métier : fil d’Ariane, le service pour ce métier et la FAQ affichée. */
export function tradeStructuredData(lang: Locale, trade: TradeKey) {
  const dict = getDictionary(lang);
  const t = dict.trades;
  const p = t.pages[trade];
  const url = absoluteUrl(tradePath(lang, trade));
  const priceVars = { setup: dict.pricing.setup, monthly: dict.pricing.monthly, footnote: dict.pricing.footnote.toLowerCase() };
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [
        { name: t.index.crumb, path: pagePath(lang, "trades") },
        { name: p.name, path: tradePath(lang, trade) },
      ]),
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: p.title,
        serviceType: dict.meta.serviceType,
        description: p.description,
        url,
        provider: { "@id": `${SITE.url}/#organization` },
        audience: { "@type": "BusinessAudience", name: p.name },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: lang,
        mainEntity: [...p.faq, t.faqPrice].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: fmt(a, priceVars) } })),
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

import type { Metadata } from "next";
import { COMPANY, PRICE, SITE, TEAM } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { FOLLOW_UP_SITUATION_KEYS, OG_LOCALE, TRADE_KEYS, blogPath, fmt, followUpPath, localePath, otherLocale, pagePath, toolPath, tradePath, type BlogKey, type FollowUpSituation, type Locale, type LocalizedPage, type ToolKey, type TradeKey } from "@/i18n/config";
import { getFollowUpCopy } from "@/i18n/follow-up";
import type { PostMeta } from "@/lib/blog";

/** Une page publique : adresse fixe (identique dans les deux langues), page à segment traduit, page métier, article du blog, outil gratuit ou page de modèles de relance. */
export type PageRef = { path: string } | { page: LocalizedPage } | { trade: TradeKey } | { post: BlogKey } | { tool: ToolKey } | { followUp: { trade: TradeKey; situation: FollowUpSituation } };

export function pathFor(lang: Locale, ref: PageRef): string {
  if ("trade" in ref) return tradePath(lang, ref.trade);
  if ("post" in ref) return blogPath(lang, ref.post);
  if ("tool" in ref) return toolPath(lang, ref.tool);
  if ("followUp" in ref) return followUpPath(lang, ref.followUp.trade, ref.followUp.situation);
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

const ORG_REF = { "@id": `${SITE.url}/#organization` };

/** Un membre de l’équipe (schema.org Person), avec son profil LinkedIn. */
function personNode(lang: Locale, member: (typeof TEAM)[number]) {
  const t = getDictionary(lang).team.members[member.key];
  return {
    "@type": "Person",
    "@id": `${SITE.url}/#${member.key}`,
    name: member.name,
    jobTitle: t.role,
    description: `${t.experience} ${t.background}`,
    image: `${SITE.url}${member.photo}`,
    url: absoluteUrl(pagePath(lang, "team")),
    sameAs: [member.linkedin],
    worksFor: ORG_REF,
  };
}

/** L’organisation (schema.org), identique sur toutes les pages qui la décrivent : fondateurs, création, siège. */
function organizationNode(lang: Locale) {
  const t = getDictionary(lang);
  return {
    "@type": "Organization",
    ...ORG_REF,
    name: SITE.name,
    url: SITE.url,
    logo: { "@type": "ImageObject", url: `${SITE.url}/apple-icon`, width: 180, height: 180 },
    slogan: t.meta.tagline,
    description: t.about.lead,
    foundingDate: String(COMPANY.founded),
    founder: TEAM.map((member) => personNode(lang, member)),
    address: { "@type": "PostalAddress", addressRegion: COMPANY.region, addressCountry: COMPANY.countryCode },
    knowsLanguage: ["en", "fr"],
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
  const org = ORG_REF;
  const price = (amount: number, extra: object = {}) => ({ "@type": "UnitPriceSpecification", price: amount, priceCurrency: "EUR", valueAddedTaxIncluded: false, ...extra });
  const answer = (text: string) => ({ "@type": "Answer", text });

  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(lang),
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

/** Variables de prix des textes ({setup}, {monthly}, {footnote}). */
export function priceVars(lang: Locale) {
  const t = getDictionary(lang).pricing;
  return { setup: t.setup, monthly: t.monthly, footnote: t.footnote.toLowerCase() };
}

/** Variables d’entreprise des textes de la page À propos et de la page Équipe ({founded}, {studio}, {studioFounded}). */
export function companyVars() {
  return { founded: COMPANY.founded, studio: COMPANY.builtBy.name, studioFounded: COMPANY.builtBy.founded };
}

/** Données structurées de la page À propos : fil d’Ariane, la page, l’organisation (fondateurs compris) et la FAQ affichée. */
export function aboutStructuredData(lang: Locale) {
  const t = getDictionary(lang).about;
  const url = absoluteUrl(pagePath(lang, "about"));
  const vars = { ...priceVars(lang), ...companyVars() };
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [{ name: t.crumb, path: pagePath(lang, "about") }]),
      { "@type": "AboutPage", "@id": `${url}#webpage`, url, name: t.title, description: t.description, inLanguage: lang, about: ORG_REF, mainEntity: ORG_REF },
      organizationNode(lang),
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: lang,
        mainEntity: t.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: fmt(a, vars) } })),
      },
    ],
  };
}

/** Données structurées de la page Équipe : fil d’Ariane, la page et l’organisation avec ses fondateurs. */
export function teamStructuredData(lang: Locale) {
  const t = getDictionary(lang).team;
  const url = absoluteUrl(pagePath(lang, "team"));
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [{ name: t.crumb, path: pagePath(lang, "team") }]),
      { "@type": "AboutPage", "@id": `${url}#webpage`, url, name: t.title, description: t.description, inLanguage: lang, about: ORG_REF },
      organizationNode(lang),
    ],
  };
}

/** Auteur d’un article : le membre de l’équipe du même nom (même @id que sur les pages À propos et Équipe), sinon une personne simple. */
function authorNode(lang: Locale, post: PostMeta) {
  const member = TEAM.find((m) => m.name === post.author.name);
  if (!member) return { "@type": "Person", name: post.author.name, jobTitle: post.author.role, ...(post.author.url ? { url: post.author.url } : {}) };
  return { "@type": "Person", "@id": `${SITE.url}/#${member.key}`, name: member.name, jobTitle: post.author.role, url: absoluteUrl(pagePath(lang, "team")), sameAs: [member.linkedin] };
}

/** Un article (schema.org BlogPosting), rattaché au blog de sa langue. */
function postNode(lang: Locale, post: PostMeta) {
  const url = absoluteUrl(post.path);
  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: lang,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    ...(post.cover ? { image: { "@type": "ImageObject", url: absoluteUrl(post.cover.src), width: post.cover.width, height: post.cover.height } } : {}),
    author: authorNode(lang, post),
    publisher: ORG_REF,
    isPartOf: { "@id": `${absoluteUrl(blogPath(lang))}#blog` },
    articleSection: post.category,
    keywords: post.keywords.join(", "),
    timeRequired: `PT${post.readingTime}M`,
  };
}

/** Données structurées de la page du blog : fil d’Ariane et le blog avec ses articles. */
export function blogIndexStructuredData(lang: Locale, posts: PostMeta[]) {
  const t = getDictionary(lang).blog;
  const url = absoluteUrl(blogPath(lang));
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [{ name: t.crumb, path: blogPath(lang) }]),
      { "@type": "Blog", "@id": `${url}#blog`, url, name: t.h1, description: t.description, inLanguage: lang, publisher: ORG_REF, blogPost: posts.map((post) => postNode(lang, post)) },
    ],
  };
}

/** Données structurées d’un article : fil d’Ariane, l’article (auteur, dates, image) et la FAQ de son en-tête. */
export function blogPostStructuredData(lang: Locale, post: PostMeta) {
  const t = getDictionary(lang).blog;
  const url = absoluteUrl(post.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [
        { name: t.crumb, path: blogPath(lang) },
        { name: post.title, path: post.path },
      ]),
      postNode(lang, post),
      ...(post.faq.length
        ? [
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              inLanguage: lang,
              mainEntity: post.faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })),
            },
          ]
        : []),
    ],
  };
}

/** Métadonnées d’un article : titre SEO tel quel, hreflang vers sa traduction, Open Graph « article » avec la couverture. */
export function blogPostMetadata(lang: Locale, post: PostMeta): Metadata {
  const title = post.seoTitle ?? post.title;
  const base = pageMetadata(lang, { post: post.key }, { title, description: post.description, absoluteTitle: true });
  const cover = post.cover ? [{ url: post.cover.src, width: post.cover.width, height: post.cover.height, alt: post.cover.alt }] : undefined;
  return {
    ...base,
    authors: [{ name: post.author.name, url: post.author.url }],
    openGraph: {
      title,
      description: post.description,
      url: post.path,
      siteName: SITE.name,
      type: "article",
      locale: OG_LOCALE[lang],
      alternateLocale: [OG_LOCALE[otherLocale(lang)]],
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [post.author.url ?? post.author.name],
      section: post.category,
      tags: post.tags,
      images: cover ?? base.openGraph?.images,
    },
    twitter: { card: "summary_large_image", title, description: post.description, ...(cover ? { images: [cover[0].url] } : {}) },
  };
}

/** Données structurées de la page des outils : fil d’Ariane et liste des outils. */
export function toolsIndexStructuredData(lang: Locale) {
  const t = getDictionary(lang).tools;
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [{ name: t.crumb, path: toolPath(lang) }]),
      {
        "@type": "ItemList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t.followUp.name, url: absoluteUrl(toolPath(lang, "quoteFollowUp")) },
          { "@type": "ListItem", position: 2, name: t.index.diagnosticTitle, url: absoluteUrl(localePath(lang, "/diagnostic")) },
        ],
      },
    ],
  };
}

/**
 * Données structurées du générateur de relances : fil d’Ariane, l’application web (gratuite)
 * et la FAQ affichée (la question sur les données suit la version affichée, avec ou sans IA).
 */
export function quoteFollowUpStructuredData(lang: Locale, aiEnabled: boolean) {
  const t = getDictionary(lang).tools;
  const f = t.followUp;
  const url = absoluteUrl(toolPath(lang, "quoteFollowUp"));
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [
        { name: t.crumb, path: toolPath(lang) },
        { name: f.name, path: toolPath(lang, "quoteFollowUp") },
      ]),
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: f.name,
        description: f.description,
        url,
        inLanguage: lang,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: 0, priceCurrency: "EUR" },
        publisher: ORG_REF,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        inLanguage: lang,
        mainEntity: [...f.faq, aiEnabled ? f.faqPrivacyAi : f.faqPrivacy].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };
}

/** Titre d’une page de modèles de relance : « Following up on a kitchen quote with no reply ». */
export function followUpCaseTitle(lang: Locale, trade: TradeKey, situation: FollowUpSituation) {
  const copy = getFollowUpCopy(lang);
  return fmt(copy.situations[situation].h1, { aQuote: copy.trades[trade].aQuote });
}

/** Données structurées d’une page de modèles : fil d’Ariane et la page, rattachée au générateur. */
export function followUpCaseStructuredData(lang: Locale, trade: TradeKey, situation: FollowUpSituation) {
  const dict = getDictionary(lang);
  const t = dict.tools;
  const copy = getFollowUpCopy(lang);
  const path = followUpPath(lang, trade, situation);
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbList(lang, [
        { name: t.crumb, path: toolPath(lang) },
        { name: t.followUp.name, path: toolPath(lang, "quoteFollowUp") },
        { name: fmt(t.followUpCase.crumb, { trade: dict.trades.pages[trade].name, situation: copy.situations[situation].label }), path },
      ]),
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: followUpCaseTitle(lang, trade, situation),
        description: fmt(copy.situations[situation].description, { audience: copy.trades[trade].audience }),
        inLanguage: lang,
        isPartOf: { "@id": `${absoluteUrl(toolPath(lang, "quoteFollowUp"))}#app` },
        publisher: ORG_REF,
      },
    ],
  };
}

/** Toutes les pages de modèles de relance (métier × situation), dans l’ordre des listes. */
export const FOLLOW_UP_CASES = TRADE_KEYS.flatMap((trade) => FOLLOW_UP_SITUATION_KEYS.map((situation) => ({ trade, situation })));

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

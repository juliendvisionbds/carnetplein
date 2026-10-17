/**
 * Configuration des langues, sans dépendance serveur : importable depuis les
 * composants client, le proxy et les métadonnées.
 *
 * L’anglais est la langue par défaut, servie à la racine (/). Le français vit sous /fr.
 */

export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie posé lors d’une redirection automatique ou d’un changement de langue explicite. */
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const OG_LOCALE: Record<Locale, string> = { en: "en_US", fr: "fr_FR" };
/** Balise BCP 47 utilisée pour Intl (dates, nombres). */
export const INTL_TAG: Record<Locale, string> = { en: "en", fr: "fr-FR" };
export const LOCALE_NAME: Record<Locale, string> = { en: "English", fr: "Français" };

export function hasLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Langue d’un dossier prospect (les dossiers antérieurs à la version bilingue sont français). */
export function leadLocale(value: unknown): Locale {
  return hasLocale(value) ? value : "fr";
}

/** Pages dont l’adresse est traduite. La clé est stable, la valeur est le segment d’URL. */
export const LOCALIZED_SLUGS = {
  privacy: { en: "privacy", fr: "confidentialite" },
  legal: { en: "legal-notice", fr: "mentions-legales" },
  trades: { en: "trades", fr: "metiers" },
  about: { en: "about", fr: "a-propos" },
  team: { en: "team", fr: "equipe" },
} as const;
export type LocalizedPage = keyof typeof LOCALIZED_SLUGS;

export function pageFromSlug(lang: Locale, slug: string): LocalizedPage | null {
  for (const key of Object.keys(LOCALIZED_SLUGS) as LocalizedPage[]) {
    if (LOCALIZED_SLUGS[key][lang] === slug) return key;
  }
  return null;
}

/**
 * Pages métiers, rangées sous la page « trades » : /trades/kitchen-installers ↔ /fr/metiers/cuisinistes.
 * Les textes vivent dans la section « trades » des dictionnaires, sous la même clé.
 * L’ordre est celui des listes (accueil, page des métiers, liens entre métiers).
 */
export const TRADE_SLUGS = {
  kitchens: { en: "kitchen-installers", fr: "cuisinistes" },
  renovation: { en: "renovation-contractors", fr: "renovation" },
  heating: { en: "hvac-contractors", fr: "chauffagistes" },
  electrical: { en: "electricians", fr: "electriciens" },
  solar: { en: "solar-installers", fr: "installateurs-photovoltaiques" },
  architects: { en: "architects", fr: "architectes" },
} as const;
export type TradeKey = keyof typeof TRADE_SLUGS;
export const TRADE_KEYS = Object.keys(TRADE_SLUGS) as TradeKey[];

export function tradeFromSlug(lang: Locale, slug: string): TradeKey | null {
  return TRADE_KEYS.find((key) => TRADE_SLUGS[key][lang] === slug) ?? null;
}

/**
 * Articles du blog (/blog/<slug> ↔ /fr/blog/<slug>) : une clé stable par article, son slug dans chaque langue.
 * Le texte vit dans content/blog/<langue>/<slug>.mdx, les images dans public/blog/<clé>/.
 * Pour publier un article : déposer les deux fichiers MDX, puis ajouter sa ligne ici. Le build
 * échoue si un fichier manque, si un MDX n’est pas déclaré ici ou si son en-tête ne correspond pas.
 */
export const BLOG_SLUGS = {
  "quote-follow-up": { en: "how-to-follow-up-on-a-quote", fr: "relancer-un-devis-modeles" },
  "client-silence": { en: "client-not-responding-after-quote", fr: "client-ne-repond-plus-apres-devis" },
  "response-time": { en: "how-fast-reply-quote-request", fr: "delai-reponse-demande-devis" },
  "qualifying-questions": { en: "questions-to-ask-before-quoting", fr: "questions-avant-devis" },
} as const;
export type BlogKey = keyof typeof BLOG_SLUGS;
export const BLOG_KEYS = Object.keys(BLOG_SLUGS) as BlogKey[];

export function blogPostFromSlug(lang: Locale, slug: string): BlogKey | null {
  return BLOG_KEYS.find((key) => BLOG_SLUGS[key][lang] === slug) ?? null;
}

/** Préfixe une adresse interne pour la langue donnée : localePath("fr", "/diagnostic") → "/fr/diagnostic". */
export function localePath(lang: Locale, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (lang === DEFAULT_LOCALE) return clean;
  return clean === "/" ? `/${lang}` : `/${lang}${clean}`;
}

export function pagePath(lang: Locale, page: LocalizedPage): string {
  return localePath(lang, `/${LOCALIZED_SLUGS[page][lang]}`);
}

export function tradePath(lang: Locale, trade: TradeKey): string {
  return localePath(lang, `/${LOCALIZED_SLUGS.trades[lang]}/${TRADE_SLUGS[trade][lang]}`);
}

/** Le blog (/blog ↔ /fr/blog, même segment dans les deux langues) ou l’un de ses articles. */
export function blogPath(lang: Locale, post?: BlogKey): string {
  return localePath(lang, post ? `/blog/${BLOG_SLUGS[post][lang]}` : "/blog");
}

/** Sépare le préfixe de langue du reste de l’adresse : "/fr/diagnostic" → { lang: "fr", path: "/diagnostic" }. Accepte aussi "/en/…" (adresse interne). */
export function stripLocale(pathname: string): { lang: Locale; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (hasLocale(first)) {
    return { lang: first, path: rest.length ? `/${rest.join("/")}` : "/" };
  }
  return { lang: DEFAULT_LOCALE, path: pathname || "/" };
}

/** Adresse équivalente dans l’autre langue (les segments traduits sont convertis). */
export function switchLocalePath(pathname: string, target: Locale): string {
  const { lang, path } = stripLocale(pathname);
  const [, first = "", ...rest] = path.split("/");
  const page = pageFromSlug(lang, first);
  if (page && rest.length === 0) return pagePath(target, page);
  const trade = page === "trades" && rest.length === 1 ? tradeFromSlug(lang, rest[0]) : null;
  if (trade) return tradePath(target, trade);
  const post = first === "blog" && rest.length === 1 ? blogPostFromSlug(lang, rest[0]) : null;
  if (post) return blogPath(target, post);
  return localePath(target, path);
}

export function otherLocale(lang: Locale): Locale {
  return lang === "en" ? "fr" : "en";
}

/** Choisit la langue à partir de l’en-tête Accept-Language ; anglais par défaut. */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const weight = q ? Number(q.slice(2)) : 1;
      return { primary: tag.trim().toLowerCase().split("-")[0], weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((x) => x.primary && x.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const { primary } of ranked) if (hasLocale(primary)) return primary;
  return DEFAULT_LOCALE;
}

/** Remplace les {variables} d’un libellé : fmt("Hello {name}", { name: "Ana" }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in vars ? String(vars[key]) : m));
}

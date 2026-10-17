import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { BLOG_KEYS, LOCALES, TRADE_KEYS, type BlogKey, type Locale } from "@/i18n/config";
import { FOLLOW_UP_CASES, pathFor, type PageRef } from "@/i18n/metadata";
import { getPostMeta, getPosts } from "@/lib/blog";

type Entry = { ref: PageRef; changeFrequency: "weekly" | "monthly" | "yearly"; priority: number; lastModified?: (lang: Locale) => string | undefined };

const PAGES: Entry[] = [
  { ref: { path: "/" }, changeFrequency: "monthly", priority: 1 },
  { ref: { path: "/diagnostic" }, changeFrequency: "monthly", priority: 0.9 },
  { ref: { page: "trades" }, changeFrequency: "monthly", priority: 0.7 },
  ...TRADE_KEYS.map((trade): Entry => ({ ref: { trade }, changeFrequency: "monthly", priority: 0.8 })),
  { ref: { page: "tools" }, changeFrequency: "monthly", priority: 0.6 },
  { ref: { tool: "quoteFollowUp" }, changeFrequency: "monthly", priority: 0.8 },
  ...FOLLOW_UP_CASES.map((followUp): Entry => ({ ref: { followUp }, changeFrequency: "monthly", priority: 0.6 })),
  { ref: { page: "about" }, changeFrequency: "monthly", priority: 0.6 },
  { ref: { page: "team" }, changeFrequency: "monthly", priority: 0.5 },
  { ref: { page: "privacy" }, changeFrequency: "yearly", priority: 0.2 },
  { ref: { page: "legal" }, changeFrequency: "yearly", priority: 0.2 },
];

/** Le blog et ses articles, datés de leur dernière mise à jour dans chaque langue. */
function blogEntries(): Entry[] {
  const updated = (lang: Locale, post: BlogKey) => {
    const meta = getPostMeta(lang, post);
    return meta.updated ?? meta.date;
  };
  return [
    { ref: { path: "/blog" }, changeFrequency: "weekly", priority: 0.6, lastModified: (lang) => getPosts(lang).map((meta) => meta.updated ?? meta.date).sort().at(-1) },
    ...BLOG_KEYS.map((post): Entry => ({ ref: { post }, changeFrequency: "monthly", priority: 0.7, lastModified: (lang) => updated(lang, post) })),
  ];
}

/** Une entrée par page et par langue, chacune annonçant ses équivalents (hreflang en, fr, x-default). */
export default function sitemap(): MetadataRoute.Sitemap {
  // Même forme que la balise canonique : la racine sans barre oblique finale.
  const abs = (path: string) => (path === "/" ? SITE.url : `${SITE.url}${path}`);
  return [...PAGES, ...blogEntries()].flatMap(({ ref, changeFrequency, priority, lastModified }) =>
    LOCALES.map((lang) => ({
      url: abs(pathFor(lang, ref)),
      ...(lastModified ? { lastModified: lastModified(lang) } : {}),
      changeFrequency,
      priority,
      alternates: {
        languages: { en: abs(pathFor("en", ref)), fr: abs(pathFor("fr", ref)), "x-default": abs(pathFor("en", ref)) },
      },
    })),
  );
}

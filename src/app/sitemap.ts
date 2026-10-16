import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { LOCALES } from "@/i18n/config";
import { pathFor, type PageRef } from "@/i18n/metadata";

type Entry = { ref: PageRef; changeFrequency: "monthly" | "yearly"; priority: number };

const PAGES: Entry[] = [
  { ref: { path: "/" }, changeFrequency: "monthly", priority: 1 },
  { ref: { path: "/diagnostic" }, changeFrequency: "monthly", priority: 0.9 },
  { ref: { page: "privacy" }, changeFrequency: "yearly", priority: 0.2 },
  { ref: { page: "legal" }, changeFrequency: "yearly", priority: 0.2 },
];

/** Une entrée par page et par langue, chacune annonçant ses équivalents (hreflang en, fr, x-default). */
export default function sitemap(): MetadataRoute.Sitemap {
  // Même forme que la balise canonique : la racine sans barre oblique finale.
  const abs = (path: string) => (path === "/" ? SITE.url : `${SITE.url}${path}`);
  return PAGES.flatMap(({ ref, changeFrequency, priority }) =>
    LOCALES.map((lang) => ({
      url: abs(pathFor(lang, ref)),
      changeFrequency,
      priority,
      alternates: {
        languages: { en: abs(pathFor("en", ref)), fr: abs(pathFor("fr", ref)), "x-default": abs(pathFor("en", ref)) },
      },
    })),
  );
}

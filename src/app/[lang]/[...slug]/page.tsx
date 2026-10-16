import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EDITOR } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { LOCALES, LOCALIZED_SLUGS, fmt, hasLocale, pageFromSlug, pagePath, type Locale, type LocalizedPage } from "@/i18n/config";
import { pageMetadata } from "@/i18n/metadata";

/**
 * Pages à segment traduit (/privacy ↔ /fr/confidentialite, /legal-notice ↔ /fr/mentions-legales).
 * Toute autre adresse sous une langue connue aboutit ici et renvoie une vraie 404.
 */

type Params = Promise<{ lang: string; slug: string[] }>;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => (Object.keys(LOCALIZED_SLUGS) as LocalizedPage[]).map((page) => ({ lang, slug: [LOCALIZED_SLUGS[page][lang]] })));
}

async function resolvePage(params: Params): Promise<{ lang: Locale; page: LocalizedPage } | null> {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || slug.length !== 1) return null;
  const page = pageFromSlug(lang, slug[0]);
  return page ? { lang, page } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolvePage(params);
  if (!r) return {};
  const t = getDictionary(r.lang);
  const s = r.page === "privacy" ? t.privacy : t.legal;
  return pageMetadata(r.lang, { page: r.page }, { title: s.title, description: `${s.h1} ${s.intro}` });
}

export default async function LocalizedPage({ params }: { params: Params }) {
  const r = await resolvePage(params);
  if (!r) notFound();
  const { lang, page } = r;
  const dict = getDictionary(lang);

  if (page === "privacy") {
    const t = dict.privacy;
    return (
      <div className="wrap">
        <div className="page-head">
          <div className="eyebrow">{t.title}</div>
          <h1>{t.h1}</h1>
          <p>{t.intro}</p>
        </div>
        <div className="panel" style={{ maxWidth: 760, marginBottom: 70 }}>
          {t.sections.map(([title, text]) => (
            <div key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const t = dict.legal;
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="eyebrow">{t.title}</div>
        <h1>{t.h1}</h1>
        <p>{t.intro}</p>
      </div>
      <div className="panel" style={{ maxWidth: 760, marginBottom: 70 }}>
        <h3>{t.publisher}</h3>
        <p>
          {fmt(t.publisherText, EDITOR)}
          <br />
          {fmt(t.contact, EDITOR)}
          <br />
          {fmt(t.director, EDITOR)}
        </p>

        <h3>{t.hosting}</h3>
        <p>{t.hostingText}</p>

        <h3>{t.ip}</h3>
        <p>{t.ipText}</p>

        <h3>{t.data}</h3>
        <p>
          {t.dataText}{" "}
          <Link href={pagePath(lang, "privacy")} style={{ textDecoration: "underline" }}>
            {t.dataLink}
          </Link>
          .
        </p>

        <h3>{t.liability}</h3>
        <p>{t.liabilityText}</p>
      </div>
    </div>
  );
}

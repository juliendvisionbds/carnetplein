import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutPage, TeamPage } from "@/components/AboutPages";
import { TradePage, TradesIndex } from "@/components/TradePages";
import { EDITOR } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { LOCALES, LOCALIZED_SLUGS, TRADE_KEYS, TRADE_SLUGS, fmt, hasLocale, pageFromSlug, pagePath, tradeFromSlug, type Locale, type LocalizedPage, type TradeKey } from "@/i18n/config";
import { pageMetadata } from "@/i18n/metadata";

/**
 * Pages à segment traduit (/privacy ↔ /fr/confidentialite, /legal-notice ↔ /fr/mentions-legales,
 * /trades ↔ /fr/metiers, /about ↔ /fr/a-propos, /team ↔ /fr/equipe) et pages métiers rangées sous /trades (/trades/kitchen-installers ↔ /fr/metiers/cuisinistes).
 * Toute autre adresse sous une langue connue aboutit ici et renvoie une vraie 404.
 */

type Params = Promise<{ lang: string; slug: string[] }>;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => [
    ...(Object.keys(LOCALIZED_SLUGS) as LocalizedPage[]).map((page) => ({ lang, slug: [LOCALIZED_SLUGS[page][lang]] })),
    ...TRADE_KEYS.map((trade) => ({ lang, slug: [LOCALIZED_SLUGS.trades[lang], TRADE_SLUGS[trade][lang]] })),
  ]);
}

async function resolvePage(params: Params): Promise<{ lang: Locale; page: LocalizedPage; trade?: TradeKey } | null> {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || slug.length > 2) return null;
  const page = pageFromSlug(lang, slug[0]);
  if (!page) return null;
  if (slug.length === 1) return { lang, page };
  const trade = page === "trades" ? tradeFromSlug(lang, slug[1]) : null;
  return trade ? { lang, page, trade } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolvePage(params);
  if (!r) return {};
  const t = getDictionary(r.lang);
  if (r.trade) {
    const p = t.trades.pages[r.trade];
    return pageMetadata(r.lang, { trade: r.trade }, { title: p.title, description: p.description });
  }
  if (r.page === "trades") return pageMetadata(r.lang, { page: r.page }, { title: t.trades.index.title, description: t.trades.index.description });
  if (r.page === "about") return pageMetadata(r.lang, { page: r.page }, { title: t.about.title, description: t.about.description, absoluteTitle: true });
  if (r.page === "team") return pageMetadata(r.lang, { page: r.page }, { title: t.team.title, description: t.team.description, absoluteTitle: true });
  const s = r.page === "privacy" ? t.privacy : t.legal;
  return pageMetadata(r.lang, { page: r.page }, { title: s.title, description: `${s.h1} ${s.intro}` });
}

export default async function LocalizedPage({ params }: { params: Params }) {
  const r = await resolvePage(params);
  if (!r) notFound();
  const { lang, page } = r;
  const dict = getDictionary(lang);

  if (r.trade) return <TradePage lang={lang} dict={dict} trade={r.trade} />;
  if (page === "trades") return <TradesIndex lang={lang} dict={dict} />;
  if (page === "about") return <AboutPage lang={lang} dict={dict} />;
  if (page === "team") return <TeamPage lang={lang} dict={dict} />;

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

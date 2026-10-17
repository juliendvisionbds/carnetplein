import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AboutPage, TeamPage } from "@/components/AboutPages";
import { FollowUpCasePage, QuoteFollowUpPage, ToolsIndex } from "@/components/ToolPages";
import { TradePage, TradesIndex } from "@/components/TradePages";
import { EDITOR } from "@/lib/content";
import { getDictionary } from "@/i18n";
import { FOLLOW_UP_SITUATIONS, LOCALES, LOCALIZED_SLUGS, TOOL_KEYS, TOOL_SLUGS, TRADE_KEYS, TRADE_SLUGS, fmt, hasLocale, pageFromSlug, pagePath, situationFromSlug, toolFromSlug, tradeFromSlug, type FollowUpSituation, type Locale, type LocalizedPage, type ToolKey, type TradeKey } from "@/i18n/config";
import { getFollowUpCopy } from "@/i18n/follow-up";
import { FOLLOW_UP_CASES, followUpCaseTitle, pageMetadata } from "@/i18n/metadata";

/**
 * Pages à segment traduit (/privacy ↔ /fr/confidentialite, /legal-notice ↔ /fr/mentions-legales,
 * /trades ↔ /fr/metiers, /about ↔ /fr/a-propos, /team ↔ /fr/equipe, /tools ↔ /fr/outils), pages métiers rangées sous /trades
 * (/trades/kitchen-installers ↔ /fr/metiers/cuisinistes), outils gratuits rangés sous /tools (/tools/quote-follow-up ↔ /fr/outils/relance-devis)
 * et pages de modèles de relance (/tools/quote-follow-up/kitchen-installers/no-reply ↔ /fr/outils/relance-devis/cuisinistes/sans-reponse).
 * Toute autre adresse sous une langue connue aboutit ici et renvoie une vraie 404.
 */

type Params = Promise<{ lang: string; slug: string[] }>;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => [
    ...(Object.keys(LOCALIZED_SLUGS) as LocalizedPage[]).map((page) => ({ lang, slug: [LOCALIZED_SLUGS[page][lang]] })),
    ...TRADE_KEYS.map((trade) => ({ lang, slug: [LOCALIZED_SLUGS.trades[lang], TRADE_SLUGS[trade][lang]] })),
    ...TOOL_KEYS.map((tool) => ({ lang, slug: [LOCALIZED_SLUGS.tools[lang], TOOL_SLUGS[tool][lang]] })),
    ...FOLLOW_UP_CASES.map(({ trade, situation }) => ({
      lang,
      slug: [LOCALIZED_SLUGS.tools[lang], TOOL_SLUGS.quoteFollowUp[lang], TRADE_SLUGS[trade][lang], FOLLOW_UP_SITUATIONS[situation][lang]],
    })),
  ]);
}

type Resolved = { lang: Locale; page: LocalizedPage; trade?: TradeKey; tool?: ToolKey; situation?: FollowUpSituation };

async function resolvePage(params: Params): Promise<Resolved | null> {
  const { lang, slug } = await params;
  if (!hasLocale(lang) || slug.length > 4) return null;
  const page = pageFromSlug(lang, slug[0]);
  if (!page) return null;
  if (slug.length === 1) return { lang, page };
  if (page === "trades") {
    const trade = slug.length === 2 ? tradeFromSlug(lang, slug[1]) : null;
    return trade ? { lang, page, trade } : null;
  }
  if (page !== "tools") return null;
  const tool = toolFromSlug(lang, slug[1]);
  if (!tool || slug.length === 3) return null;
  if (slug.length === 2) return { lang, page, tool };
  // Page de modèles : /tools/quote-follow-up/<métier>/<situation>.
  const trade = tool === "quoteFollowUp" ? tradeFromSlug(lang, slug[2]) : null;
  const situation = situationFromSlug(lang, slug[3]);
  return trade && situation ? { lang, page, tool, trade, situation } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolvePage(params);
  if (!r) return {};
  const t = getDictionary(r.lang);
  if (r.trade && r.situation) {
    const s = getFollowUpCopy(r.lang).situations[r.situation];
    const title = followUpCaseTitle(r.lang, r.trade, r.situation);
    const description = fmt(s.description, { audience: getFollowUpCopy(r.lang).trades[r.trade].audience });
    return pageMetadata(r.lang, { followUp: { trade: r.trade, situation: r.situation } }, { title: `${title}${t.tools.followUpCase.titleSuffix}`, description, absoluteTitle: true });
  }
  if (r.tool) return pageMetadata(r.lang, { tool: r.tool }, { title: t.tools.followUp.title, description: t.tools.followUp.description, absoluteTitle: true });
  if (r.page === "tools") return pageMetadata(r.lang, { page: r.page }, { title: t.tools.index.title, description: t.tools.index.description });
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

  if (r.trade && r.situation) return <FollowUpCasePage lang={lang} dict={dict} trade={r.trade} situation={r.situation} />;
  if (r.tool) return <QuoteFollowUpPage lang={lang} dict={dict} />;
  if (page === "tools") return <ToolsIndex lang={lang} dict={dict} />;
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

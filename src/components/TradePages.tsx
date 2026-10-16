import Link from "next/link";
import { HeroQuestion } from "@/components/HeroQuestion";
import type { Dictionary } from "@/i18n";
import { TRADE_KEYS, fmt, localePath, pagePath, tradePath, type Locale, type TradeKey } from "@/i18n/config";
import { jsonLdScript, tradeStructuredData, tradesIndexStructuredData } from "@/i18n/metadata";
import { firstQuestionCard } from "@/lib/diagnostic";

/**
 * Pages métiers : la page des métiers (/trades ↔ /fr/metiers) et une page par métier, construite
 * comme l’accueil (moments où les projets se perdent, méthode, FAQ, appel au diagnostic).
 */

type TradesText = Dictionary["trades"];

/** Fil d’Ariane visible, repris dans les données structurées. */
function Crumbs({ lang, t, trade }: { lang: Locale; t: TradesText; trade?: TradeKey }) {
  return (
    <nav className="crumbs" aria-label={t.crumbAria}>
      <Link href={localePath(lang, "/")}>{t.crumbHome}</Link>
      {trade ? (
        <>
          <Link href={pagePath(lang, "trades")}>{t.index.crumb}</Link>
          <span aria-current="page">{t.pages[trade].name}</span>
        </>
      ) : (
        <span aria-current="page">{t.index.crumb}</span>
      )}
    </nav>
  );
}

/** Liens vers les pages métiers, puis vers la page des métiers (accueil, bas des pages métiers). */
export function TradeLinks({ lang, t, exclude }: { lang: Locale; t: TradesText; exclude?: TradeKey }) {
  return (
    <ul className="trade-links">
      {TRADE_KEYS.filter((trade) => trade !== exclude).map((trade) => (
        <li key={trade}>
          <Link href={tradePath(lang, trade)}>{t.pages[trade].name}</Link>
        </li>
      ))}
      <li>
        <Link className="all" href={pagePath(lang, "trades")}>
          {t.all}
        </Link>
      </li>
    </ul>
  );
}

export function TradesIndex({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.trades;
  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(tradesIndexStructuredData(lang))} />
      <div className="page-head">
        <Crumbs lang={lang} t={t} />
        <div className="eyebrow">{t.index.eyebrow}</div>
        <h1>{t.index.h1}</h1>
        <p>{t.index.intro}</p>
      </div>
      <div className="three trade-cards">
        {TRADE_KEYS.map((trade) => {
          const p = t.pages[trade];
          return (
            <Link className="feature trade-card" key={trade} href={tradePath(lang, trade)}>
              <h2>{p.name}</h2>
              <p>{p.teaser}</p>
              <span className="more">{t.index.cardCta}</span>
            </Link>
          );
        })}
      </div>
      <div className="cta-band" style={{ marginTop: 70 }}>
        <h2>{t.index.notListedTitle}</h2>
        <p>{t.index.notListedText}</p>
        <Link className="btn" href={localePath(lang, "/diagnostic")}>
          {dict.home.cta}
        </Link>
      </div>
    </div>
  );
}

export function TradePage({ lang, dict, trade }: { lang: Locale; dict: Dictionary; trade: TradeKey }) {
  const t = dict.trades;
  const p = t.pages[trade];
  const home = dict.home;
  const diagnosticHref = localePath(lang, "/diagnostic");
  const priceVars = { setup: dict.pricing.setup, monthly: dict.pricing.monthly, footnote: dict.pricing.footnote.toLowerCase() };

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(tradeStructuredData(lang, trade))} />
      <div className="hero trade-hero">
        <div>
          <Crumbs lang={lang} t={t} trade={trade} />
          <div className="eyebrow">{p.eyebrow}</div>
          <h1>
            {p.h1}
            <br />
            <em>{p.h1em}</em>
          </h1>
          <p>{p.intro}</p>
        </div>
        <HeroQuestion lang={lang} t={dict.hero} question={firstQuestionCard(dict.diagnostic)} />
      </div>

      <section className="outcomes" aria-label={home.outcomesAria}>
        <div className="outcomes-title">
          {home.outcomesTitle}
          <span>{home.outcomesSub}</span>
        </div>
        <ol>
          {home.outcomes.map(([title, text]) => (
            <li key={title}>
              <b>{title}</b>
              <span>{fmt(text, { delay: dict.demoDelay })}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="block">
        <div className="section-head">
          <div className="eyebrow">{t.momentsEyebrow}</div>
          <h2>{p.momentsTitle}</h2>
          <p>{p.momentsIntro}</p>
        </div>
        <div className="three">
          {p.moments.map((m, i) => (
            <article className="feature" key={m.num}>
              <span className="num">
                <i>0{i + 1}</i> {m.num}
              </span>
              <h3>
                {m.quoteA}
                <br />
                {m.quoteB}
              </h3>
              <p>{m.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="dark-block">
          <div>
            <div className="eyebrow">{t.methodEyebrow}</div>
            <h2 style={{ marginTop: 20 }}>
              {p.methodTitleA}
              <br />
              {p.methodTitleB}
            </h2>
            <p>{p.methodIntro}</p>
            <Link className="btn lime" href={diagnosticHref}>
              {home.methodCta}
            </Link>
          </div>
          <div className="steps">
            {p.steps.map(([title, text], i) => (
              <div className="step" key={title}>
                <b>{i + 1}</b>
                <div>
                  <h4>{title}</h4>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="block faq">
        <h2>{home.faqTitle}</h2>
        {[...p.faq, t.faqPrice].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{fmt(a, priceVars)}</p>
          </details>
        ))}
      </section>

      <section className="trade-others">
        <h2>{t.others}</h2>
        <TradeLinks lang={lang} t={t} exclude={trade} />
      </section>

      <div className="cta-band">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          {home.ctaEyebrow}
        </div>
        <h2>{p.ctaTitle}</h2>
        <p>{p.ctaIntro}</p>
        <Link className="btn" href={diagnosticHref}>
          {home.cta}
        </Link>
      </div>
    </div>
  );
}

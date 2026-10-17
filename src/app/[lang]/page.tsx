import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroQuestion } from "@/components/HeroQuestion";
import { TradeLinks } from "@/components/TradePages";
import { getDictionary } from "@/i18n";
import { fmt, hasLocale, localePath, pagePath } from "@/i18n/config";
import { homeStructuredData, jsonLdScript, pageMetadata } from "@/i18n/metadata";
import { firstQuestionCard } from "@/lib/diagnostic";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return pageMetadata(lang, { path: "/" }, { title: t.meta.title, description: t.meta.description, absoluteTitle: true });
}

export default async function HomePage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const t = dict.home;
  const d = dict.diagnostic;
  const diagnosticHref = localePath(lang, "/diagnostic");

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(homeStructuredData(lang))} />
      <div className="hero">
        <div>
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>
            {t.h1a}
            <br />
            {t.h1b}
            <br />
            <em>{t.h1c}</em>
          </h1>
          <p>{t.intro}</p>
        </div>
        <HeroQuestion lang={lang} t={dict.hero} question={firstQuestionCard(d)} />
      </div>

      <section className="outcomes" aria-label={t.outcomesAria}>
        <div className="outcomes-title">
          {t.outcomesTitle}
          <span>{t.outcomesSub}</span>
        </div>
        <ol>
          {t.outcomes.map(([title, text]) => (
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
          <h2>{t.momentsTitle}</h2>
          <p>{t.momentsIntro}</p>
        </div>
        <div className="three">
          {t.moments.map((m, i) => (
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
        <div className="dark-block" id="methode">
          <div>
            <div className="eyebrow">{t.methodEyebrow}</div>
            <h2 style={{ marginTop: 20 }}>
              {t.methodTitleA}
              <br />
              {t.methodTitleB}
            </h2>
            <p>{t.methodIntro}</p>
            <Link className="btn lime" href={diagnosticHref}>
              {t.methodCta}
            </Link>
          </div>
          <div className="steps">
            {t.steps.map(([title, text], i) => (
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

      <section className="block">
        <div className="section-head">
          <div className="eyebrow">{t.tradesEyebrow}</div>
          <h2>{t.tradesTitle}</h2>
          <p>{t.tradesIntro}</p>
        </div>
        <TradeLinks lang={lang} t={dict.trades} />
      </section>

      <section className="block faq" id="faq">
        <h2>{t.faqTitle}</h2>
        {t.faq.map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{fmt(a, { setup: dict.pricing.setup, monthly: dict.pricing.monthly, footnote: dict.pricing.footnote.toLowerCase() })}</p>
          </details>
        ))}
        <details>
          <summary>{t.faqPrivacyQ}</summary>
          <p>
            {t.faqPrivacyA} <Link href={pagePath(lang, "privacy")}>{t.faqPrivacyLink}</Link>.
          </p>
        </details>
      </section>

      <div className="cta-band">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          {t.ctaEyebrow}
        </div>
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaIntro}</p>
        <Link className="btn" href={diagnosticHref}>
          {t.cta}
        </Link>
      </div>
    </div>
  );
}

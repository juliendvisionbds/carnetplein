import Link from "next/link";
import { PostToc, TemplateQuote } from "@/components/BlogClient";
import { PostCard } from "@/components/BlogPages";
import { FollowUpTool, MessageView } from "@/components/FollowUpTool";
import type { Dictionary } from "@/i18n";
import { FOLLOW_UP_SITUATION_KEYS, TRADE_KEYS, blogPath, fmt, followUpPath, localePath, toolPath, tradePath, type FollowUpSituation, type Locale, type TradeKey } from "@/i18n/config";
import { getFollowUpCopy } from "@/i18n/follow-up";
import { followUpCaseStructuredData, followUpCaseTitle, jsonLdScript, quoteFollowUpStructuredData, toolsIndexStructuredData } from "@/i18n/metadata";
import { getPostMeta, getPosts } from "@/lib/blog";
import { buildFollowUp, type FollowUpTrade } from "@/lib/follow-up";
import { followUpAiEnabled } from "@/lib/follow-up-ai";

/**
 * Outils gratuits, construits comme ceux de visionbtp.com/outils : la page des outils (/tools ↔ /fr/outils),
 * le générateur de relances (/tools/quote-follow-up ↔ /fr/outils/relance-devis : formulaire et résultat,
 * guide, modèles par métier, FAQ, autres outils, lectures) et une page de modèles par métier et situation.
 */

type ToolsText = Dictionary["tools"];

/** Articles du blog liés aux relances, s’ils sont publiés. */
const FOLLOW_UP_POSTS = ["quote-follow-up", "client-silence"] as const;

/** Fil d’Ariane visible : accueil, outils, puis l’outil et la page de modèles le cas échéant. */
function Crumbs({ lang, dict, current }: { lang: Locale; dict: Dictionary; current?: { tool?: boolean; label: string } }) {
  const t = dict.tools;
  return (
    <nav className="crumbs" aria-label={dict.trades.crumbAria}>
      <Link href={localePath(lang, "/")}>{dict.trades.crumbHome}</Link>
      {current ? <Link href={toolPath(lang)}>{t.crumb}</Link> : <span aria-current="page">{t.crumb}</span>}
      {current && !current.tool && <Link href={toolPath(lang, "quoteFollowUp")}>{t.followUp.name}</Link>}
      {current && <span aria-current="page">{current.label}</span>}
    </nav>
  );
}

function DiagnosticBand({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const home = dict.home;
  return (
    <div className="cta-band">
      <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
        {home.ctaEyebrow}
      </div>
      <h2>{home.ctaTitle}</h2>
      <p>{home.ctaIntro}</p>
      <Link className="btn" href={localePath(lang, "/diagnostic")}>
        {home.cta}
      </Link>
    </div>
  );
}

/** Le générateur, avec ce dont il a besoin côté navigateur : textes, modèles de la langue, liste des métiers. */
function Generator({ lang, dict, initial, children }: { lang: Locale; dict: Dictionary; initial?: { trade?: FollowUpTrade; situation?: FollowUpSituation }; children: React.ReactNode }) {
  const f = dict.tools.followUp;
  return (
    <FollowUpTool
      lang={lang}
      t={{ form: f.form, result: f.result, bridge: f.bridge, example: f.example }}
      copy={getFollowUpCopy(lang)}
      trades={TRADE_KEYS.map((key) => ({ key, name: dict.trades.pages[key].name }))}
      initial={initial}
      aiEnabled={followUpAiEnabled()}
      diagnosticHref={localePath(lang, "/diagnostic")}
    >
      {children}
    </FollowUpTool>
  );
}

/** Les pages de modèles, rangées par métier : une carte par métier, un lien par situation. */
function TemplatesGrid({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const copy = getFollowUpCopy(lang);
  return (
    <div className="fu-matrix">
      {TRADE_KEYS.map((trade) => (
        <div className="fu-matrix-card" key={trade}>
          <h3>{dict.trades.pages[trade].name}</h3>
          <ul>
            {FOLLOW_UP_SITUATION_KEYS.map((situation) => (
              <li key={situation}>
                <Link href={followUpPath(lang, trade, situation)}>{copy.situations[situation].label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Cartes des articles du blog consacrés aux relances. */
function FollowUpReading({ lang, dict, title }: { lang: Locale; dict: Dictionary; title: string }) {
  const posts = getPosts(lang).filter((meta) => (FOLLOW_UP_POSTS as readonly string[]).includes(meta.key));
  if (posts.length === 0) return null;
  return (
    <section className="post-more tools-reading" aria-labelledby="tools-reading">
      <div className="post-more-head">
        <h2 id="tools-reading">{title}</h2>
        <Link href={blogPath(lang)}>{dict.blog.all}</Link>
      </div>
      <div className="post-grid">
        {posts.map((meta) => (
          <PostCard key={meta.key} lang={lang} t={dict.blog} meta={meta} level={3} />
        ))}
      </div>
    </section>
  );
}

/** Cartes des outils disponibles : le générateur de relances et le diagnostic. */
function AvailableTools({ lang, t, exclude }: { lang: Locale; t: ToolsText; exclude?: "quoteFollowUp" }) {
  return (
    <div className="three tool-cards">
      {exclude !== "quoteFollowUp" && (
        <Link className="feature tool-card-link" href={toolPath(lang, "quoteFollowUp")}>
          <span className="badge lime">{t.index.badgeAvailable}</span>
          <h3>{t.followUp.name}</h3>
          <p>{t.index.followUpText}</p>
          <span className="more">{t.index.followUpCta}</span>
        </Link>
      )}
      <Link className="feature tool-card-link" href={localePath(lang, "/diagnostic")}>
        <span className="badge lime">{t.index.badgeAvailable}</span>
        <h3>{t.index.diagnosticTitle}</h3>
        <p>{t.index.diagnosticText}</p>
        <span className="more">{t.index.diagnosticCta}</span>
      </Link>
    </div>
  );
}

export function ToolsIndex({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.tools;
  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(toolsIndexStructuredData(lang))} />
      <div className="page-head">
        <Crumbs lang={lang} dict={dict} />
        <div className="eyebrow">{t.index.eyebrow}</div>
        <h1>{t.index.h1}</h1>
        <p>{t.index.intro}</p>
      </div>

      <section className="tools-section" aria-labelledby="tools-available">
        <h2 className="tools-title" id="tools-available">
          {t.index.available}
        </h2>
        <AvailableTools lang={lang} t={t} />
      </section>

      <section className="tools-section" aria-labelledby="tools-soon">
        <h2 className="tools-title" id="tools-soon">
          {t.index.soon}
        </h2>
        <div className="three tool-cards">
          {t.index.upcoming.map(([title, text]) => (
            <div className="feature tool-soon" key={title}>
              <span className="badge grey">{t.index.badgeSoon}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="tools-section" aria-labelledby="tools-templates">
        <h2 className="tools-title" id="tools-templates">
          {t.index.templatesTitle}
        </h2>
        <TemplatesGrid lang={lang} dict={dict} />
      </section>

      <FollowUpReading lang={lang} dict={dict} title={t.index.readTitle} />
      <div style={{ height: 70 }} />
      <DiagnosticBand lang={lang} dict={dict} />
    </div>
  );
}

export function QuoteFollowUpPage({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.tools;
  const f = t.followUp;
  const g = f.guide;
  const aiEnabled = followUpAiEnabled();
  const toc = g.sections.map((section) => ({ id: `g-${section.id}`, text: section.title }));
  const guidePost = getPosts(lang).some((meta) => meta.key === "quote-follow-up") ? getPostMeta(lang, "quote-follow-up") : null;

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(quoteFollowUpStructuredData(lang, aiEnabled))} />

      <Generator lang={lang} dict={dict}>
        <Crumbs lang={lang} dict={dict} current={{ tool: true, label: f.name }} />
        <div className="eyebrow">{f.eyebrow}</div>
        <h1>
          {f.h1}
          <br />
          <em>{f.h1em}</em>
        </h1>
        <p>{f.intro}</p>
        <ul className="tool-checks">
          {f.checks.map((check) => (
            <li key={check}>{check}</li>
          ))}
        </ul>
      </Generator>

      <section className="tool-guide" id="guide" aria-labelledby="guide-title">
        <div className="section-head">
          <div className="eyebrow">{g.eyebrow}</div>
          <h2 id="guide-title">{g.title}</h2>
          <p>{g.intro}</p>
        </div>
        <div className="post-layout tool-guide-layout">
          <aside className="post-aside">
            <PostToc items={toc} title={g.toc} />
          </aside>
          <div className="post tool-guide-body">
            <details className="post-toc-mobile">
              <summary>{g.toc}</summary>
              <ol>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </details>
            <div className="post-body">
              {g.sections.map((section, i) => (
                <section key={section.id}>
                  <h2 id={`g-${section.id}`}>
                    {i + 1}. {section.title}
                  </h2>
                  <p>{section.text}</p>
                  {section.list.length > 0 && (
                    <ul>
                      {section.list.map(([lead, text]) => (
                        <li key={lead}>
                          <strong>{lead}</strong> {text}
                        </li>
                      ))}
                    </ul>
                  )}
                  {section.template && (
                    <>
                      <p className="template-label">
                        <strong>{g.templateLabel}</strong>
                      </p>
                      <TemplateQuote copy={dict.blog.copy} copied={dict.blog.copied}>
                        {g.template.split("\n\n").map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </TemplateQuote>
                    </>
                  )}
                  {section.after && <p>{section.after}</p>}
                </section>
              ))}
              {guidePost && (
                <p className="read-next">
                  <strong>{g.readMore}</strong>
                  <Link href={guidePost.path}>{guidePost.title}</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="tools-section" id="templates" aria-labelledby="templates-title">
        <div className="section-head">
          <div className="eyebrow">{f.templatesEyebrow}</div>
          <h2 id="templates-title">{f.templatesTitle}</h2>
          <p>{f.templatesIntro}</p>
        </div>
        <TemplatesGrid lang={lang} dict={dict} />
      </section>

      <section className="block faq tool-faq" id="faq" aria-labelledby="faq-title">
        <div className="eyebrow">{f.faqEyebrow}</div>
        <h2 id="faq-title">{f.faqTitle}</h2>
        {[...f.faq, aiEnabled ? f.faqPrivacyAi : f.faqPrivacy].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>

      <section className="tools-section" aria-labelledby="more-tools">
        <div className="post-more-head">
          <h2 id="more-tools">{f.moreTools}</h2>
          <Link href={toolPath(lang)}>{f.allTools}</Link>
        </div>
        <AvailableTools lang={lang} t={t} exclude="quoteFollowUp" />
      </section>

      <FollowUpReading lang={lang} dict={dict} title={f.readTitle} />
      <div style={{ height: 70 }} />
      <DiagnosticBand lang={lang} dict={dict} />
    </div>
  );
}

export function FollowUpCasePage({ lang, dict, trade, situation }: { lang: Locale; dict: Dictionary; trade: TradeKey; situation: FollowUpSituation }) {
  const t = dict.tools;
  const c = t.followUpCase;
  const r = t.followUp.result;
  const copy = getFollowUpCopy(lang);
  const tradeName = dict.trades.pages[trade].name;
  const tradeCopy = copy.trades[trade];
  const s = copy.situations[situation];
  const { sequence } = buildFollowUp(copy, { trade, situation, elapsed: "days" });

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(followUpCaseStructuredData(lang, trade, situation))} />
      <div className="page-head fu-case-head">
        <Crumbs lang={lang} dict={dict} current={{ label: fmt(c.crumb, { trade: tradeName, situation: s.label }) }} />
        <div className="eyebrow">{fmt(c.eyebrow, { trade: tradeName })}</div>
        <h1>{followUpCaseTitle(lang, trade, situation)}</h1>
        <p>{tradeCopy.insights[situation]}</p>
        <ul className="tool-checks">
          {c.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>

      <section className="fu-steps" aria-labelledby="fu-steps-title">
        <div className="section-head">
          <h2 id="fu-steps-title">{c.sequenceTitle}</h2>
          <p>{c.sequenceIntro}</p>
        </div>
        <ol className="fu-step-list">
          {sequence.map((step, i) => (
            <li className="fu-step" key={step.when}>
              <div className="fu-step-head">
                <i aria-hidden="true">{i + 1}</i>
                <div>
                  <span className="fu-when">{step.when}</span>
                  <h3>{step.goal}</h3>
                  <small>{fmt(c.channel, { channel: step.channel })}</small>
                </div>
              </div>
              <div className="fu-step-msgs">
                <MessageView kind="email" label={r.email} subject={step.message.subject} body={step.message.body} t={r} />
                <MessageView kind="sms" label={r.sms} body={step.message.sms} t={r} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-section fu-why" aria-labelledby="fu-why-title">
        <div className="section-head">
          <h2 id="fu-why-title">{c.whyTitle}</h2>
          <p>{s.why}</p>
        </div>
        <div>
          <h3 className="fu-tips-title">{c.tipsTitle}</h3>
          <ul className="who-list">
            {s.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="fu-case-tool" id="tool">
        <Generator lang={lang} dict={dict} initial={{ trade, situation }}>
          <div className="eyebrow">{t.followUp.eyebrow}</div>
          <h2>{c.toolTitle}</h2>
          <p>{c.toolIntro}</p>
        </Generator>
      </div>

      <section className="fu-related" aria-label={t.followUp.templatesTitle}>
        <div>
          <h2>{fmt(c.sameTrade, { audience: tradeCopy.audience })}</h2>
          <ul className="trade-links">
            {FOLLOW_UP_SITUATION_KEYS.filter((key) => key !== situation).map((key) => (
              <li key={key}>
                <Link href={followUpPath(lang, trade, key)}>{copy.situations[key].label}</Link>
              </li>
            ))}
            <li>
              <Link className="all" href={tradePath(lang, trade)}>
                {fmt(c.tradePage, { audience: tradeCopy.audience })}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2>{c.sameSituation}</h2>
          <ul className="trade-links">
            {TRADE_KEYS.filter((key) => key !== trade).map((key) => (
              <li key={key}>
                <Link href={followUpPath(lang, key, situation)}>{dict.trades.pages[key].name}</Link>
              </li>
            ))}
            <li>
              <Link className="all" href={`${toolPath(lang, "quoteFollowUp")}#templates`}>
                {c.allTemplates}
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <DiagnosticBand lang={lang} dict={dict} />
    </div>
  );
}

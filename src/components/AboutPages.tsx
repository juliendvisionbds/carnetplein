import Image from "next/image";
import Link from "next/link";
import type { Dictionary } from "@/i18n";
import { TRADE_KEYS, fmt, localePath, pagePath, tradePath, type Locale } from "@/i18n/config";
import { aboutStructuredData, companyVars, jsonLdScript, priceVars, teamStructuredData } from "@/i18n/metadata";
import { COMPANY, SITE, TEAM } from "@/lib/content";

/**
 * Page À propos (/about ↔ /fr/a-propos) et page Équipe (/team ↔ /fr/equipe).
 * La page À propos suit un plan pensé pour les moteurs de recherche et les assistants IA :
 * proposition de valeur, services, différences, clients, équipe, fonctionnement, faits clés (tableau), FAQ.
 */

/** Fil d’Ariane visible (accueil, puis la page), repris dans les données structurées. */
function Crumbs({ lang, dict, current }: { lang: Locale; dict: Dictionary; current: string }) {
  return (
    <nav className="crumbs" aria-label={dict.trades.crumbAria}>
      <Link href={localePath(lang, "/")}>{dict.trades.crumbHome}</Link>
      <span aria-current="page">{current}</span>
    </nav>
  );
}

function External({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Bloc à deux colonnes : titre de section à gauche, contenu à droite. */
function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="block about-section" aria-labelledby={id}>
      <div className="section-head">
        <div className="eyebrow">{eyebrow}</div>
        <h2 id={id}>{title}</h2>
        {intro && <p>{intro}</p>}
      </div>
      <div className="about-body">{children}</div>
    </section>
  );
}

export function AboutPage({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.about;
  const f = t.facts;
  const vars = { ...priceVars(lang), ...companyVars() };
  const diagnosticHref = localePath(lang, "/diagnostic");

  const linkedinLinks = TEAM.map((m, i) => (
    <span key={m.key}>
      {i > 0 && ", "}
      <External href={m.linkedin}>{m.name} (LinkedIn)</External>
    </span>
  ));

  // Faits clés : un tableau HTML, lisible tel quel par les robots. Les faits non renseignés (null) ne s’affichent pas.
  const facts: [string, React.ReactNode][] = [
    [f.name, SITE.name],
    [f.type, f.typeValue],
    [f.founded, fmt(f.foundedValue, vars)],
    [f.founders, TEAM.map((m) => m.name).join(", ")],
    [f.hq, `${COMPANY.region} (${COMPANY.department}), ${COMPANY.country}`],
    [f.website, <a href={SITE.url}>{new URL(SITE.url).host}</a>],
    [f.offering, f.offeringValue],
    [f.pricing, fmt(f.pricingValue, vars)],
    [f.contract, f.contractValue],
    [f.services, f.servicesValue],
    [f.communication, f.communicationValue],
    [f.audience, f.audienceValue],
    ...(
      [
        [f.notableClients, COMPANY.notableClients],
        [f.customersServed, COMPANY.customersServed],
        [f.projectsDelivered, COMPANY.projectsDelivered],
      ] as [string, string | null][]
    ).filter((row): row is [string, string] => row[1] !== null),
    [f.competitors, f.competitorsValue],
    [f.languages, f.languagesValue],
    [f.social, linkedinLinks],
    [f.builtBy, <External href={COMPANY.builtBy.url}>{COMPANY.builtBy.name}</External>],
  ];

  return (
    <div className="wrap about">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(aboutStructuredData(lang))} />
      <div className="page-head about-head">
        <Crumbs lang={lang} dict={dict} current={t.crumb} />
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.h1}</h1>
        <p>{t.lead}</p>
      </div>

      <ul className="about-stats" aria-label={t.statsAria}>
        {t.stats.map(([value, label]) => (
          <li key={value}>
            <b>{value}</b>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <Section id="what" eyebrow={t.doesEyebrow} title={t.doesTitle} intro={t.doesIntro}>
        {t.services.map(([title, text]) => (
          <article className="about-item" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </Section>

      <Section id="different" eyebrow={t.diffEyebrow} title={t.diffTitle} intro={t.diffIntro}>
        {t.differentiators.map(([title, text], i) => (
          <article className="about-item numbered" key={title}>
            <i aria-hidden="true">0{i + 1}</i>
            <h3>{title}</h3>
            <p>{fmt(text, vars)}</p>
          </article>
        ))}
      </Section>

      <Section id="who" eyebrow={t.whoEyebrow} title={t.whoTitle} intro={t.whoIntro}>
        <ul className="who-list">
          {TRADE_KEYS.map((trade) => (
            <li key={trade}>
              <Link href={tradePath(lang, trade)}>{dict.trades.pages[trade].name}</Link> {t.whoTrades[trade]}
            </li>
          ))}
          {t.whoOthers.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="who-not">{t.whoNot}</p>
      </Section>

      <Section id="team" eyebrow={t.teamEyebrow} title={t.teamTitle}>
        {t.origin.map((text) => (
          <p className="about-origin" key={text}>
            {fmt(text, vars)}
          </p>
        ))}
        <div className="founders">
          {TEAM.map((m) => {
            const member = dict.team.members[m.key];
            return (
              <article className="founder" key={m.key}>
                <Image src={m.photo} alt={m.name} width={64} height={64} />
                <div>
                  <h3>{m.name}</h3>
                  <span className="founder-role">{member.role}</span>
                  <p>
                    {member.experience} {member.background}
                  </p>
                  <External className="founder-link" href={m.linkedin}>
                    {t.linkedin} ↗
                  </External>
                </div>
              </article>
            );
          })}
        </div>
        <Link className="about-more" href={pagePath(lang, "team")}>
          {t.teamLink}
        </Link>
      </Section>

      <section className="block" aria-labelledby="how">
        <div className="dark-block">
          <div>
            <div className="eyebrow">{t.howEyebrow}</div>
            <h2 id="how" style={{ marginTop: 20 }}>
              {t.howTitle}
            </h2>
            <p>{t.howIntro}</p>
            <p className="how-note">{t.howNote}</p>
            <Link className="btn lime" href={diagnosticHref}>
              {dict.home.methodCta}
            </Link>
          </div>
          <div className="steps">
            {t.how.map(([title, text], i) => (
              <div className="step" key={title}>
                <b>{i + 1}</b>
                <div>
                  <h3>{title}</h3>
                  <p>{fmt(text, vars)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section id="facts" eyebrow={t.factsEyebrow} title={t.factsTitle}>
        <table className="facts">
          <caption className="sr-only">{t.factsCaption}</caption>
          <tbody>
            {facts.map(([label, value]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section id="faq" eyebrow={t.faqEyebrow} title={t.faqTitle}>
        <div className="faq-list">
          {t.faq.map(([q, a]) => (
            <div key={q}>
              <h3>{q}</h3>
              <p>{fmt(a, vars)}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="cta-band">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <Link className="btn" href={diagnosticHref}>
          {dict.home.cta}
        </Link>
      </div>
    </div>
  );
}

export function TeamPage({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const t = dict.team;
  const vars = companyVars();

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(teamStructuredData(lang))} />
      <div className="page-head">
        <Crumbs lang={lang} dict={dict} current={t.crumb} />
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.h1}</h1>
        <p>{fmt(t.intro, vars)}</p>
      </div>

      <div className="team-grid">
        {TEAM.map((m) => {
          const member = t.members[m.key];
          return (
            <article className="member" key={m.key}>
              <div className="member-head">
                <Image src={m.photo} alt={m.name} width={120} height={120} loading="eager" />
                <div>
                  <h2>{m.name}</h2>
                  <span className="member-role">{member.role}</span>
                </div>
              </div>
              <p className="member-experience">{member.experience}</p>
              <dl>
                <dt>{t.background}</dt>
                <dd>{member.background}</dd>
                <dt>{t.atVision}</dt>
                <dd>{member.atVision}</dd>
              </dl>
              <External className="btn small outline" href={m.linkedin}>
                {t.linkedin}
              </External>
            </article>
          );
        })}
      </div>

      <section className="block" aria-labelledby="promises">
        <div className="section-head">
          <div className="eyebrow">{t.promisesEyebrow}</div>
          <h2 id="promises">{t.promisesTitle}</h2>
        </div>
        <div className="three">
          {t.promises.map(([title, text], i) => (
            <article className="feature" key={title}>
              <span className="num">
                <i>0{i + 1}</i>
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel lavender studio" aria-labelledby="studio">
        <div className="eyebrow">{t.studioEyebrow}</div>
        <h2 id="studio">{fmt(t.studioTitle, vars)}</h2>
        <p>{fmt(t.studioText, vars)}</p>
        <External className="btn small" href={COMPANY.builtBy.url}>
          {t.studioLink}
        </External>
      </section>

      <div className="cta-band">
        <h2>{t.ctaTitle}</h2>
        <p>{t.ctaText}</p>
        <Link className="btn" href={localePath(lang, "/diagnostic")}>
          {dict.home.cta}
        </Link>
      </div>
    </div>
  );
}

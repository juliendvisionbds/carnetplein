import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { EVIDENCE_IDS, STAGE_DEMO_SENT, diagnose, formatAnswer, profileFor, simulationDefaults } from "@/lib/diagnostic";
import { BOOKING_URL } from "@/lib/content";
import { tradeLabel } from "@/lib/trades";
import { MetaBand } from "@/components/MetaBand";
import { TrackView } from "@/components/espace/TrackView";
import { CallModal } from "@/components/espace/CallModal";
import { Simulator } from "@/components/espace/Simulator";
import { DemoLink } from "@/components/espace/DemoLink";
import { getDictionary } from "@/i18n";
import { fmt, hasLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

type Params = Promise<{ lang: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  return { title: getDictionary(lang).espace.title, robots: { index: false, follow: false } };
}

export default async function EspacePage({ params }: { params: Params }) {
  const { lang, token } = await params;
  if (!hasLocale(lang)) notFound();
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) notFound();
  const lead = await getStore().getLeadByToken(token);
  if (!lead) notFound();

  const dict = getDictionary(lang);
  const t = dict.espace;
  const d = dict.diagnostic;

  const a = lead.answers;
  const diag = { ...diagnose(a), key: lead.priority, secondary: lead.secondary, intensity: lead.intensity };
  const p = profileFor(a, diag, d);
  const firstName = lead.name.split(" ")[0];
  const company = lead.company || tradeLabel(lead.trade, lang) || new URL(lead.website).hostname.replace(/^www\./, "");
  const demoSent = Boolean(lead.demo_url) || lead.stage >= STAGE_DEMO_SENT;
  const booked = Boolean(lead.booking);
  const sim = simulationDefaults(a);

  const footnote = diag.uncertain
    ? t.footnotes.uncertain
    : diag.lowVolume && diag.key !== "acquisition"
      ? t.footnotes.lowVolume
      : diag.key === "acquisition"
        ? t.footnotes.acquisition
        : diag.key === "optimisation"
          ? t.footnotes.optimisation
          : t.footnotes.default;

  return (
    <div className="wrap">
      <TrackView token={token} />
      <CallModal
        token={token}
        name={lead.name}
        email={lead.email}
        bookingUrl={BOOKING_URL}
        initial={lead.booking}
        lang={lang}
        t={dict.callModal}
        tb={dict.booking}
        call={dict.call}
        demoDelayShort={dict.demoDelayShort}
      />

      <div className="page-head">
        <div className="eyebrow">{fmt(t.eyebrow, { company })}</div>
        <h1>
          {fmt(t.hello, { name: firstName })}
          <br />
          {t.priorityLine}
          <span style={{ color: "#7971af" }}>{p.tag.toLowerCase()}</span>.
        </h1>
        <p>{t.intro}</p>
        <div className="actions">
          <a className="btn lime" href="#rdv">
            {dict.call.title} <span>↗</span>
          </a>
        </div>
      </div>

      <div className="result-layout" style={{ marginTop: 40 }}>
        <div>
          <div className="panel lavender">
            <div className="priority-row">
              <span className="badge lg lime">{fmt(t.priorityBadge, { tag: p.tag })}</span>
              <span className={`badge lg ${diag.intensity === "forte" ? "orange" : "grey"}`}>{d.intensity[diag.intensity]}</span>
            </div>
            <h2>{p.title}</h2>
            <p>{p.intro}</p>
            {EVIDENCE_IDS[diag.key].map((id) => (
              <div className="evidence" key={id}>
                <span>{d.evidence[id]}</span>« {formatAnswer(a, id, d)} »
              </div>
            ))}
            {diag.secondary && (
              <div className="signal">
                <span className="signal-tag">{t.secondarySignal}</span>
                <b>{fmt(t.alsoWatch, { tag: d.profiles[diag.secondary].tag.toLowerCase() })}</b>
                <p>{fmt(t.secondaryText, { hint: d.secondaryHints[diag.secondary] })}</p>
              </div>
            )}
            <p className="micro">{footnote}</p>
          </div>

          <div className="panel">
            <div className="eyebrow">{t.actionPlan}</div>
            <ol className="action-list">
              {p.actions.map(([title, detail]) => (
                <li key={title}>
                  <div>
                    <b>{title}</b>
                    <small>{detail}</small>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Simulator {...sim} lang={lang} t={dict.simulator} />
        </div>

        <aside>
          <div className="panel">
            <div className="eyebrow">{t.projectEyebrow}</div>
            <div className="timeline">
              <div className="done">
                <b>{t.tlDiagnosticDone}</b>
                <small>{fmt(t.tlPriority, { tag: p.tag })}</small>
              </div>
              <div className={demoSent ? "done" : "current"}>
                <b>{t.tlDemoPrep}</b>
                <small>
                  {t.tlDemoPrepText}
                  {!demoSent && fmt(t.tlDemoPrepWhen, { delay: dict.demoDelay })}
                </small>
                {!demoSent && (
                  <div className="notice">
                    <b>{t.tlReceiveTitle}</b>
                    {t.tlReceiveText}
                  </div>
                )}
              </div>
              <div className={demoSent ? "done" : ""}>
                <b>{t.tlDemoSent}</b>
                <small>{demoSent ? t.tlDemoReady : t.tlDemoWaiting}</small>
                {lead.demo_url && <DemoLink token={token} href={lead.demo_url} label={t.demoLink} />}
              </div>
              <div className={booked ? "done" : demoSent ? "current" : ""}>
                <b>{booked ? t.tlCallBooked : t.tlCallToBook}</b>
                <small>
                  {booked && lead.booking?.kind === "request"
                    ? fmt(t.tlRequest, { label: lead.booking.label ?? lead.booking.date ?? "", time: lead.booking.time ?? "" })
                    : booked
                      ? t.tlConfirmed
                      : fmt(t.tlCallText, { duration: dict.call.duration })}
                </small>
                {!booked && (
                  <a className="btn small lime" href="#rdv">
                    {t.pickSlot}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="panel call-card">
            <div className="eyebrow">{t.callEyebrow}</div>
            <h3 style={{ marginTop: 18 }}>
              {dict.call.duration}.
              <br />
              {t.callTitleB}
            </h3>
            <p style={{ fontSize: 13 }}>{booked ? (lead.booking?.kind === "request" ? t.callRequestSent : t.callConfirmed) : t.callDefault}</p>
            <a className="btn lime block" href="#rdv">
              {booked ? t.callManage : dict.call.title} <span>↗</span>
            </a>
          </div>

          <div className="panel">
            <div className="eyebrow">{t.tomorrowEyebrow}</div>
            <div className="preview-path steps-path">
              {p.projection.map((x, i) => (
                <div key={x}>
                  <small>
                    {t.step} 0{i + 1}
                  </small>
                  <b>{x}</b>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <MetaBand t={dict.metaBand} cta={{ href: "#rdv", label: dict.call.title }} />
    </div>
  );
}

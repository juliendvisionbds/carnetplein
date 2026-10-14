import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import {
  EVIDENCE_IDS,
  EVIDENCE_LABELS,
  SECONDARY_HINT,
  STAGE_DEMO_SENT,
  diagnose,
  formatAnswer,
  profileFor,
  profiles,
  simulationDefaults,
} from "@/lib/diagnostic";
import { BOOKING_URL, CALL, DEMO_DELAY, META, PRICING } from "@/lib/content";
import { buildReport } from "@/lib/report";
import { MetaBand } from "@/components/MetaBand";
import { TrackView } from "@/components/espace/TrackView";
import { Booking } from "@/components/espace/Booking";
import { Simulator } from "@/components/espace/Simulator";
import { DownloadReport } from "@/components/espace/DownloadReport";
import { ClientPreview } from "@/components/espace/ClientPreview";
import { DemoLink } from "@/components/espace/DemoLink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Votre espace",
  robots: { index: false, follow: false },
};

export default async function EspacePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) notFound();
  const lead = await getStore().getLeadByToken(token);
  if (!lead) notFound();

  const a = lead.answers;
  const d = { ...diagnose(a), key: lead.priority, secondary: lead.secondary, intensity: lead.intensity };
  const p = profileFor(a, d);
  const firstName = lead.name.split(" ")[0];
  const company = lead.company || lead.trade || new URL(lead.website).hostname.replace(/^www\./, "");
  const demoSent = Boolean(lead.demo_url) || lead.stage >= STAGE_DEMO_SENT;
  const booked = Boolean(lead.booking);
  const sim = simulationDefaults(a);
  const report = buildReport(lead);

  const footnote = d.uncertain
    ? "Plusieurs réponses sont incertaines : commencez par observer votre activité pendant un mois, la démo vous y aidera."
    : d.lowVolume && d.key !== "acquisition"
      ? "Avec moins de cinq demandes par mois, chacune compte double : c’est précisément pour cela que votre priorité mérite d’être traitée vite."
      : d.key === "acquisition"
        ? "Le suivi seul ne résout pas le manque de demandes. Nous vérifierons d’abord ensemble si notre offre est pertinente pour vous."
        : d.key === "optimisation"
          ? "Votre parcours fonctionne déjà bien : la démo servira à vérifier s’il existe un gain concret."
          : "Diagnostic indicatif fondé sur vos réponses. Vos trois actions peuvent aussi être mises en place avec vos outils actuels.";

  return (
    <div className="wrap">
      <TrackView token={token} />

      <div className="page-head">
        <div className="eyebrow">Votre espace · {company}</div>
        <h1>
          Bonjour {firstName},
          <br />
          votre priorité : <span style={{ color: "#7971af" }}>{p.tag.toLowerCase()}</span>.
        </h1>
        <p>
          Votre diagnostic, vos trois actions et la suite, réunis ici. Gardez ce lien : c’est votre accès personnel, vous l’avez aussi reçu
          par e-mail.
        </p>
        <div className="actions">
          <a className="btn lime" href="#rdv">
            {CALL.title} <span>↗</span>
          </a>
          <DownloadReport token={token} content={report} className="btn outline" />
        </div>
      </div>

      <MetaBand eyebrow={META.eyebrow} title={META.title} body={META.body} punchline={META.punchline} />

      <div className="result-layout" style={{ marginTop: 40 }}>
        <div>
          <div className="panel lavender">
            <span className="badge purple">Votre priorité · {p.tag}</span>{" "}
            <span className={`badge ${d.intensity === "forte" ? "orange" : "grey"}`}>Intensité {d.intensity}</span>
            <h2>{p.title}</h2>
            <p>{p.intro}</p>
            {EVIDENCE_IDS[d.key].map((id) => (
              <div className="evidence" key={id}>
                <span>{EVIDENCE_LABELS[id]}</span>« {formatAnswer(a, id)} »
              </div>
            ))}
            {d.secondary && (
              <div className="notice">
                <b>À surveiller aussi : {profiles[d.secondary].tag.toLowerCase()}</b>
                Vos réponses indiquent que {SECONDARY_HINT[d.secondary]}. Nous en tiendrons compte dans votre démo.
              </div>
            )}
            <p className="micro">{footnote}</p>
          </div>

          <div className="panel">
            <div className="eyebrow">Votre plan d’action</div>
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
            <DownloadReport token={token} content={report} />
          </div>

          <Simulator {...sim} />

          <ClientPreview token={token} trade={lead.trade} company={company} />
        </div>

        <aside>
          <div className="panel">
            <div className="eyebrow">Votre projet Carnet Plein</div>
            <div className="timeline">
              <div className="done">
                <b>Diagnostic terminé</b>
                <small>Priorité : {p.tag}.</small>
              </div>
              <div className={demoSent ? "done" : "current"}>
                <b>Démo en préparation</b>
                <small>
                  Nous construisons la version complète de votre tunnel de vente, à vos couleurs, à partir de vos réponses.
                  {!demoSent && <> Vous la recevrez par e-mail {DEMO_DELAY}.</>}
                </small>
                {!demoSent && (
                  <div className="notice">
                    <b>Ce que vous recevrez</b>
                    La page de demande adaptée à votre métier, l’accusé de réception immédiat, l’espace de suivi de vos prospects et la
                    vue qui vous dit qui rappeler, et pourquoi.
                  </div>
                )}
              </div>
              <div className={demoSent ? "done" : ""}>
                <b>Démo envoyée</b>
                <small>{demoSent ? "Votre démo est prête. Regardez-la comme le ferait un de vos clients." : "Vous recevrez un e-mail dès qu’elle est en ligne."}</small>
                {lead.demo_url && <DemoLink token={token} href={lead.demo_url} />}
              </div>
              <div className={booked ? "done" : demoSent ? "current" : ""}>
                <b>{booked ? "Rendez-vous planifié" : "Rendez-vous à planifier"}</b>
                <small>
                  {booked && lead.booking?.kind === "request"
                    ? `${lead.booking.label} à ${lead.booking.time} · heure de Paris (à confirmer)`
                    : booked
                      ? "Confirmé. L’invitation est dans votre agenda."
                      : `${CALL.duration} pour regarder le parcours ensemble. Avant ou après la démo, comme vous préférez.`}
                </small>
                {!booked && (
                  <a className="btn small lime" href="#rdv">
                    Choisir un créneau ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          <Booking token={token} name={lead.name} email={lead.email} bookingUrl={BOOKING_URL} initial={lead.booking} />

          <div className="panel">
            <div className="eyebrow">Votre parcours, demain</div>
            <div className="preview-path">
              {p.projection.map((x, i) => (
                <div key={x}>
                  <small>ÉTAPE 0{i + 1}</small>
                  <b>{x}</b>
                </div>
              ))}
            </div>
            <h4>Et après la démo ?</h4>
            <p style={{ fontSize: 13 }}>
              Si elle vous plaît : installation à <b>{PRICING.setup}</b>, puis suivi à <b>{PRICING.monthly}</b>. {PRICING.footnote}.
            </p>
          </div>
        </aside>
      </div>

      <div className="cta-band">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          La suite tient en {CALL.duration}
        </div>
        <h2>On regarde votre tunnel de vente ensemble ?</h2>
        <p>Vos réponses à l’écran, votre démo en préparation, et vos questions. Sans engagement.</p>
        <a className="btn" href="#rdv">
          {CALL.title} ↗
        </a>
      </div>
    </div>
  );
}

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
import { BOOKING_URL, CALL, DEMO_DELAY, META } from "@/lib/content";
import { MetaBand } from "@/components/MetaBand";
import { TrackView } from "@/components/espace/TrackView";
import { CallModal } from "@/components/espace/CallModal";
import { Simulator } from "@/components/espace/Simulator";
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
      <CallModal token={token} name={lead.name} email={lead.email} bookingUrl={BOOKING_URL} initial={lead.booking} />

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
        </div>
      </div>

      <div className="result-layout" style={{ marginTop: 40 }}>
        <div>
          <div className="panel lavender">
            <div className="priority-row">
              <span className="badge lg lime">Votre priorité · {p.tag}</span>
              <span className={`badge lg ${d.intensity === "forte" ? "orange" : "grey"}`}>Intensité {d.intensity}</span>
            </div>
            <h2>{p.title}</h2>
            <p>{p.intro}</p>
            {EVIDENCE_IDS[d.key].map((id) => (
              <div className="evidence" key={id}>
                <span>{EVIDENCE_LABELS[id]}</span>« {formatAnswer(a, id)} »
              </div>
            ))}
            {d.secondary && (
              <div className="signal">
                <span className="signal-tag">Signal secondaire</span>
                <b>À surveiller aussi : {profiles[d.secondary].tag.toLowerCase()}</b>
                <p>Vos réponses indiquent que {SECONDARY_HINT[d.secondary]}. Nous en tiendrons compte dans votre démo.</p>
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
          </div>

          <Simulator {...sim} />
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

          <div className="panel call-card">
            <div className="eyebrow">On regarde ça ensemble ?</div>
            <h3 style={{ marginTop: 18 }}>
              {CALL.duration}.
              <br />
              Votre projet à l’écran.
            </h3>
            <p style={{ fontSize: 13 }}>
              {booked
                ? lead.booking?.kind === "request"
                  ? "Votre demande de créneau est envoyée, nous la confirmons par e-mail."
                  : "Votre rendez-vous est confirmé, l’invitation est dans votre agenda."
                : "On vous montre la démo de votre tunnel de vente, construite pour votre métier, et on la confronte à votre diagnostic."}
            </p>
            <a className="btn lime block" href="#rdv">
              {booked ? "Voir ou modifier mon rendez-vous" : CALL.title} <span>↗</span>
            </a>
          </div>

          <div className="panel">
            <div className="eyebrow">Votre parcours, demain</div>
            <div className="preview-path steps-path">
              {p.projection.map((x, i) => (
                <div key={x}>
                  <small>ÉTAPE 0{i + 1}</small>
                  <b>{x}</b>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <MetaBand eyebrow={META.eyebrow} title={META.title} body={META.body} cta={{ href: "#rdv", label: CALL.title }} />
    </div>
  );
}

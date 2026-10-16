import Link from "next/link";
import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { STAGES, formatAnswer, questions, questionLabel } from "@/lib/diagnostic";
import { SITE } from "@/lib/content";
import { TRADES } from "@/lib/trades";
import { espaceUrl } from "@/lib/email";
import { getDictionary } from "@/i18n";
import { LOCALE_NAME, leadLocale } from "@/i18n/config";
import { addNote, deleteLead, requireAdmin, setDemoUrl, setStage, setTrade } from "../../actions";

export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris" });
const FR = getDictionary("fr");

const EVENT_LABELS: Record<string, string> = {
  lead_created: "Diagnostic envoyé",
  diagnostic_redone: "Diagnostic refait",
  espace_viewed: "Espace ouvert",
  booking_viewed: "Section rendez-vous consultée",
  booking_scheduled: "Rendez-vous confirmé (agenda)",
  booking_requested: "Créneau demandé",
  demo_opened: "Démo ouverte",
  demo_sent: "Démo enregistrée",
  email_demo_sent: "E-mail « démo prête » envoyé",
  email_demo_skipped: "E-mail « démo prête » non envoyé (Resend absent ?)",
  report_downloaded: "Synthèse téléchargée",
  preview_played: "Avant-goût joué",
  stage_changed: "Étape modifiée",
};

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { err } = await searchParams;
  const store = getStore();
  const lead = await store.getLeadById(id);
  if (!lead) notFound();
  const [notes, events] = await Promise.all([store.listNotes(id), store.listEvents(id)]);
  const lang = leadLocale(lead.locale);
  const d = FR.diagnostic;
  const p = d.profiles[lead.priority];
  // Le message suggéré est rédigé dans la langue du prospect ; le reste de la fiche reste en français.
  const pl = getDictionary(lang).diagnostic.profiles[lead.priority];
  const call = getDictionary(lang).call;
  const firstName = lead.name.split(" ")[0];
  const espace = espaceUrl(lead);

  const followUp =
    lang === "en"
      ? lead.demo_url
        ? `Hi ${firstName},\n\nYour demo is live: ${lead.demo_url}\nIt builds on your priority (${pl.tag.toLowerCase()}) and the first contact tailored to your trade.\n\nWatch it the way one of your customers would, then let’s take ${call.duration} to talk it through: ${espace}#rdv\n\nTalk soon,`
        : `Hi ${firstName},\n\nThanks for your diagnostic. Your priority: ${pl.tag.toLowerCase()}. We’re currently building the full demo of your sales funnel.\n\nIf you’d like to get a head start, ${call.duration} are enough to look at your answers together: ${espace}#rdv\n\nTalk soon,`
      : lead.demo_url
        ? `Bonjour ${firstName},\n\nVotre démo est en ligne : ${lead.demo_url}\nElle reprend votre priorité (${pl.tag.toLowerCase()}) et la prise de contact adaptée à votre métier.\n\nRegardez-la comme le ferait un de vos clients, puis prenons ${call.duration} pour en parler : ${espace}#rdv\n\nÀ très vite,`
        : `Bonjour ${firstName},\n\nMerci pour votre diagnostic. Votre priorité : ${pl.tag.toLowerCase()}. Nous construisons en ce moment la démo complète de votre tunnel de vente.\n\nSi vous voulez prendre un peu d’avance, ${call.duration} suffisent pour regarder vos réponses ensemble : ${espace}#rdv\n\nÀ très vite,`;

  const mailSubject = lang === "en" ? `Your ${SITE.name} diagnostic` : `Votre diagnostic ${SITE.name}`;

  return (
    <div className="admin">
      <div className="crumbs">
        <Link href="/admin">← Pilotage</Link>
        <span>/</span>
        <span>{lead.company || lead.name}</span>
      </div>
      <div className="admin-top" style={{ marginTop: 14 }}>
        <div>
          <span className="badge purple">{p.tag}</span> <span className="badge grey">Intensité {lead.intensity}</span>{" "}
          {lead.secondary && <span className="badge grey">Aussi : {d.profiles[lead.secondary].tag}</span>}{" "}
          <span className="badge grey">{LOCALE_NAME[lang]}</span>
          <h1 style={{ marginTop: 12 }}>{lead.company || lead.name}</h1>
          <p style={{ margin: "6px 0 0" }}>
            {lead.name}
            {lead.trade ? ` · ${lead.trade}` : " · métier à préciser"}
          </p>
        </div>
        <div className="actions">
          <a className="btn outline small" href={`mailto:${lead.email}?subject=${encodeURIComponent(mailSubject)}`}>
            Écrire un e-mail
          </a>
          <a className="btn outline small" href={espace} target="_blank" rel="noreferrer">
            Voir son espace ↗
          </a>
        </div>
      </div>

      <div className="lead-detail">
        <div>
          <div className="panel">
            <div className="eyebrow">Contact</div>
            <div className="kv">
              <span>E-mail</span>
              <a href={`mailto:${lead.email}`}>{lead.email}</a>
              <span>Téléphone</span>
              <div>{lead.phone ? <a href={`tel:${lead.phone}`}>{lead.phone}</a> : "Non renseigné"}</div>
              <span>Site</span>
              <a href={lead.website} target="_blank" rel="noreferrer">
                {lead.website}
              </a>
              <span>Langue</span>
              <div>{LOCALE_NAME[lang]}</div>
              {lead.site_title && (
                <>
                  <span>Titre du site</span>
                  <div>{lead.site_title}</div>
                </>
              )}
              {lead.site_description && (
                <>
                  <span>Description</span>
                  <div>{lead.site_description}</div>
                </>
              )}
              <span>Diagnostic reçu</span>
              <div>{fmt.format(new Date(lead.created_at))}</div>
              <span>Dernière visite</span>
              <div>{lead.last_seen_at ? fmt.format(new Date(lead.last_seen_at)) : "Jamais revenu"}</div>
              {lead.utm && (
                <>
                  <span>Source</span>
                  <div>
                    {Object.entries(lead.utm)
                      .map(([k, v]) => `${k.replace("utm_", "")} : ${v}`)
                      .join(" · ")}
                  </div>
                </>
              )}
            </div>
            <form action={setTrade} className="inline-form" style={{ marginTop: 10 }}>
              <input type="hidden" name="id" value={lead.id} />
              <label className="field">
                Métier {lead.trade ? "(détecté depuis le site, modifiable)" : "(non détecté : à renseigner)"}
                <input name="trade" list="trades" maxLength={120} defaultValue={lead.trade ?? ""} placeholder="Ex. : cuisiniste, paysagiste…" />
                <datalist id="trades">
                  {TRADES.map((t) => (
                    <option key={t.label} value={t.label} />
                  ))}
                </datalist>
              </label>
              <button className="btn outline small" type="submit">
                Enregistrer
              </button>
            </form>
            {lead.context && (
              <>
                <h4>Contexte fourni</h4>
                <p style={{ fontSize: 13 }}>{lead.context}</p>
              </>
            )}
          </div>

          <div className="panel lavender">
            <div className="eyebrow">Diagnostic</div>
            <h3 style={{ marginTop: 14 }}>{p.title}</h3>
            <p style={{ fontSize: 13 }}>{p.intro}</p>
            <details>
              <summary>Les neuf réponses</summary>
              <div className="answers">
                {questions.map((q) => (
                  <p key={q.id}>
                    <b>{questionLabel(q, d)}</b>
                    {formatAnswer(lead.answers, q.id, d)}
                  </p>
                ))}
              </div>
            </details>
          </div>

          <div className="panel">
            <div className="eyebrow">Message de suivi suggéré</div>
            <p style={{ fontSize: 12 }}>
              Rédigé en {LOCALE_NAME[lang].toLowerCase()}, la langue du prospect. À adapter au stade réel du dossier, puis à copier dans votre e-mail.
            </p>
            <div className="copy-block">{followUp}</div>
          </div>
        </div>

        <aside>
          <div className="panel">
            <div className="eyebrow">Étape commerciale</div>
            <form action={setStage} className="inline-form" style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={lead.id} />
              <label className="field">
                Étape
                <select name="stage" defaultValue={lead.stage}>
                  {STAGES.map((s, n) => (
                    <option key={s} value={n}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn small" type="submit">
                Mettre à jour
              </button>
            </form>
            {lead.booking && (
              <div className="notice">
                <b>{lead.booking.kind === "request" ? "Créneau demandé (à confirmer par e-mail)" : "Rendez-vous confirmé via l’agenda"}</b>
                {lead.booking.kind === "request" ? `${lead.booking.label} à ${lead.booking.time} (Paris)` : fmt.format(new Date(lead.booking.at))}
                {lead.booking.message && <div style={{ marginTop: 6 }}>« {lead.booking.message} »</div>}
              </div>
            )}
          </div>

          <div className="panel">
            <div className="eyebrow">Démo du tunnel de vente</div>
            <p style={{ fontSize: 12 }}>
              Collez le lien de la démo construite pour ce prospect. Le dossier passe en « Démo envoyée » et le lien apparaît dans son espace.
            </p>
            <form action={setDemoUrl}>
              <input type="hidden" name="id" value={lead.id} />
              <label className="field">
                Lien de la démo
                <input name="demo_url" type="url" inputMode="url" placeholder="https://…" defaultValue={lead.demo_url ?? ""} />
              </label>
              {err === "demo_url" && (
                <p className="error" role="alert">
                  Ce lien n’est pas une adresse valide.
                </p>
              )}
              <label className="check" style={{ margin: "12px 0" }}>
                <input type="checkbox" name="notify" defaultChecked />
                <span>Envoyer l’e-mail « Votre démo est prête » au prospect (en {LOCALE_NAME[lang].toLowerCase()})</span>
              </label>
              <button className="btn small" type="submit">
                {lead.demo_url ? "Mettre à jour la démo" : "Enregistrer et envoyer"}
              </button>
            </form>
          </div>

          <div className="panel">
            <div className="eyebrow">Notes de suivi</div>
            <form action={addNote}>
              <input type="hidden" name="id" value={lead.id} />
              <label className="field" style={{ marginTop: 14 }}>
                Prochaine action ou note
                <textarea name="note" rows={2} required placeholder="À rappeler jeudi, vérifier l’outil de devis…" />
              </label>
              <button className="btn small" style={{ marginTop: 12 }} type="submit">
                Enregistrer la note
              </button>
            </form>
            <div className="notes">
              {notes.length === 0 && <p style={{ fontSize: 12 }}>Aucune note pour le moment.</p>}
              {notes.map((n) => (
                <div className="note" key={n.id}>
                  {n.body}
                  <small>{fmt.format(new Date(n.created_at))}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="eyebrow">Activité</div>
            <ul className="events">
              {events.length === 0 && <li>Aucune activité.</li>}
              {events.map((e) => (
                <li key={e.id}>
                  <span>
                    {EVENT_LABELS[e.type] ?? e.type}
                    {e.type === "stage_changed" && e.payload ? ` : ${String(e.payload.from)} → ${String(e.payload.to)}` : ""}
                  </span>
                  <time dateTime={e.created_at}>{fmt.format(new Date(e.created_at))}</time>
                </li>
              ))}
            </ul>
          </div>

          <form action={deleteLead} style={{ marginTop: 10, textAlign: "right" }}>
            <input type="hidden" name="id" value={lead.id} />
            <button className="btn danger small" type="submit">
              Supprimer ce dossier
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getStore, type Lead } from "@/lib/store";
import { STAGES, STAGE_BOOKED, STAGE_DEMO_SENT, STAGE_LOST, STAGE_NEW, STAGE_PREP, STAGE_WON } from "@/lib/diagnostic";
import { getDictionary } from "@/i18n";
import { LOCALE_NAME, leadLocale } from "@/i18n/config";
import { SITE } from "@/lib/content";
import { isEmailConfigured } from "@/lib/email";
import { isSupabaseConfigured } from "@/lib/store";
import { logout, requireAdmin } from "./actions";

export const dynamic = "force-dynamic";

const fmtDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
const profiles = getDictionary("fr").diagnostic.profiles;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function nextAction(l: Lead): string | null {
  switch (l.stage) {
    case STAGE_NEW:
      return "Examiner le diagnostic, vérifier la pertinence de l’offre, passer en « Démo en préparation »";
    case STAGE_PREP:
      return `Construire la démo autour de : ${profiles[l.priority].tag}${daysSince(l.updated_at) >= 3 ? " · en retard" : ""}`;
    case STAGE_DEMO_SENT:
      return daysSince(l.updated_at) >= 2 ? "Relancer : la démo est envoyée depuis plus de deux jours sans rendez-vous" : "Attendre le retour sur la démo (relance à J+2)";
    case STAGE_BOOKED:
      return l.booking?.kind === "request" ? `Confirmer le créneau demandé : ${l.booking.label} à ${l.booking.time}` : "Préparer le rendez-vous : relire le diagnostic et la démo";
    default:
      return null;
  }
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string }> }) {
  await requireAdmin();
  const { q = "", view = "actifs" } = await searchParams;
  const leads = await getStore().listLeads();

  const needle = q.trim().toLowerCase();
  const matches = (l: Lead) => !needle || [l.company, l.name, l.trade, l.email, l.website].filter(Boolean).join(" ").toLowerCase().includes(needle);
  const visible = leads.filter(matches);
  const columns = view === "perdus" ? [STAGE_LOST] : [STAGE_NEW, STAGE_PREP, STAGE_DEMO_SENT, STAGE_BOOKED, STAGE_WON];

  const todo = leads
    .filter((l) => l.stage < STAGE_WON)
    .map((l) => ({ lead: l, action: nextAction(l) }))
    .filter((x) => x.action)
    .sort((a, b) => a.lead.stage - b.lead.stage || a.lead.updated_at.localeCompare(b.lead.updated_at))
    .slice(0, 8);

  return (
    <div className="admin">
      <div className="admin-top">
        <div>
          <div className="eyebrow">L’atelier {SITE.name}</div>
          <h1 style={{ marginTop: 13 }}>
            Les bonnes conversations,
            <br />
            au bon moment.
          </h1>
        </div>
        <div className="actions">
          <a className="btn outline small" href="/admin/export">
            Exporter en CSV ↓
          </a>
          <form action={logout}>
            <button className="text-btn" type="submit">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {(!isSupabaseConfigured() || !isEmailConfigured()) && (
        <div className="setup-warning">
          {!isSupabaseConfigured() && <>Supabase n’est pas configuré : les dossiers sont stockés localement (développement). </>}
          {!isEmailConfigured() && <>Resend n’est pas configuré : aucun e-mail n’est envoyé aux prospects ni à l’équipe.</>}
        </div>
      )}

      <div className="stats">
        <div className="stat">
          Dossiers<strong>{leads.length}</strong>
        </div>
        <div className="stat">
          Nouveaux<strong>{leads.filter((l) => l.stage === STAGE_NEW).length}</strong>
        </div>
        <div className="stat">
          Démos à construire<strong>{leads.filter((l) => l.stage === STAGE_PREP).length}</strong>
        </div>
        <div className="stat">
          Rendez-vous<strong>{leads.filter((l) => l.stage === STAGE_BOOKED).length}</strong>
        </div>
        <div className="stat">
          Clients signés<strong>{leads.filter((l) => l.stage === STAGE_WON).length}</strong>
        </div>
      </div>

      <div className="toolbar">
        <form method="get">
          <input type="search" name="q" aria-label="Rechercher un dossier" placeholder="Rechercher une entreprise, un métier, un e-mail…" defaultValue={q} />
          <select name="view" aria-label="Vue" defaultValue={view}>
            <option value="actifs">Dossiers actifs</option>
            <option value="perdus">Dossiers perdus</option>
          </select>
          <button className="btn outline small" type="submit">
            Filtrer
          </button>
        </form>
      </div>

      <div className="board" style={view === "perdus" ? { gridTemplateColumns: "1fr" } : undefined}>
        {columns.map((stage) => {
          const items = visible.filter((l) => l.stage === stage);
          return (
            <section className="column" key={stage}>
              <div className="column-title">
                <span>{STAGES[stage].toUpperCase()}</span>
                <span>{items.length}</span>
              </div>
              {items.length === 0 && <div className="empty">Aucun dossier à cette étape.</div>}
              {items.map((l) => (
                <Link className="lead" href={`/admin/leads/${l.id}`} key={l.id}>
                  <span className={`badge ${stage === STAGE_PREP ? "orange" : "purple"}`}>{profiles[l.priority].tag}</span>
                  <h4>{l.company || l.name}</h4>
                  <p>
                    {l.trade ?? new URL(l.website).hostname.replace(/^www\./, "")}
                    {leadLocale(l.locale) !== "fr" ? ` · ${LOCALE_NAME[leadLocale(l.locale)]}` : ""}
                    {l.booking && stage === STAGE_BOOKED ? ` · RDV ${l.booking.kind === "request" ? "demandé" : "confirmé"}` : ""}
                  </p>
                  <div className="lead-bottom">
                    <span>
                      {fmtDate.format(new Date(l.created_at))}
                      {l.last_seen_at ? ` · vu le ${fmtDate.format(new Date(l.last_seen_at))}` : ""}
                    </span>
                    <span className="avatar">{l.name.charAt(0).toUpperCase()}</span>
                  </div>
                </Link>
              ))}
            </section>
          );
        })}
      </div>

      <section className="panel" style={{ marginTop: 25 }}>
        <div className="eyebrow">Vos prochaines actions</div>
        <h3 style={{ marginTop: 15 }}>La liste du matin.</h3>
        <div className="preview-path">
          {todo.length === 0 && <p>Aucune action en attente.</p>}
          {todo.map(({ lead, action }) => (
            <Link href={`/admin/leads/${lead.id}`} key={lead.id}>
              <div>
                <b>{lead.company || lead.name}</b> <span className="badge grey">{STAGES[lead.stage]}</span>
                <small>{action}</small>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import { SITE, PRICING, CALL, DEMO_DELAY } from "@/lib/content";
import { profiles, formatAnswer, questions, questionLabel } from "@/lib/diagnostic";
import type { Lead } from "@/lib/store";

/**
 * Envoi d’e-mails via Resend (API REST, sans SDK).
 * Si RESEND_API_KEY est absent, les envois sont ignorés et journalisés : l’app reste fonctionnelle.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Carnet Plein <onboarding@resend.dev>";
const AGENCY_EMAIL = process.env.AGENCY_NOTIFY_EMAIL;

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function send(to: string | string[], subject: string, html: string, replyTo?: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.info(`[email ignoré — RESEND_API_KEY absent] → ${Array.isArray(to) ? to.join(", ") : to} : ${subject}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error("[email] Resend a répondu", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[email] échec d’envoi", e);
    return false;
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f8f7f2;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#272727">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:22px;letter-spacing:-1px;margin-bottom:24px">carnet plein<span style="color:#8a83c6">.</span></div>
    <div style="background:#fffefa;border:1px solid #e2e2d8;border-radius:12px;padding:28px">
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;letter-spacing:-.8px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#76766e;margin-top:20px">${esc(SITE.name)} · ${esc(SITE.tagline)}</p>
  </div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#272727;color:#fff;text-decoration:none;padding:14px 22px;border-radius:7px;font-weight:600">${esc(label)}</a></p>`;

export function espaceUrl(lead: Lead): string {
  return `${SITE.url}/espace/${lead.token}`;
}

export function adminLeadUrl(lead: Lead): string {
  return `${SITE.url}/admin/leads/${lead.id}`;
}

/** Au prospect : son diagnostic est prêt, lien vers son espace. */
export async function sendDiagnosticReady(lead: Lead) {
  const p = profiles[lead.priority];
  const firstName = lead.name.split(" ")[0];
  const html = layout(
    `${esc(firstName)}, votre diagnostic est prêt.`,
    `<p>Merci d’avoir pris trois minutes pour nous raconter votre quotidien. Votre priorité : <b>${esc(p.tag)}</b>.</p>
     <p style="color:#76766e">${esc(p.title)}</p>
     <p>Votre espace personnel réunit le diagnostic, vos trois actions et la suite :</p>
     ${btn(espaceUrl(lead), "Ouvrir mon espace")}
     <p><b>Ce qui se passe maintenant :</b> nous construisons la démo complète de votre tunnel de vente, à vos couleurs, à partir de vos réponses. Vous la recevrez ${esc(DEMO_DELAY)}.</p>
     <p>En attendant, le plus utile est de réserver ${esc(CALL.duration)} avec nous pour en parler : le lien est dans votre espace.</p>
     <p style="font-size:12px;color:#76766e">Gardez cet e-mail : le lien ci-dessus est votre accès personnel.</p>`,
  );
  return send(lead.email, `Votre diagnostic Carnet Plein est prêt — ${p.tag}`, html, AGENCY_EMAIL);
}

/** À l’agence : nouveau dossier avec synthèse des réponses. */
export async function sendNewLeadToAgency(lead: Lead, redo: boolean) {
  if (!AGENCY_EMAIL) return false;
  const p = profiles[lead.priority];
  const answers = questions
    .map((q) => `<li><span style="color:#76766e">${esc(questionLabel(q))}</span><br>${esc(formatAnswer(lead.answers, q.id))}</li>`)
    .join("");
  const html = layout(
    `${redo ? "Diagnostic refait" : "Nouveau diagnostic"} · ${esc(lead.company || lead.name)}`,
    `<p><b>${esc(lead.name)}</b>${lead.company ? ` · ${esc(lead.company)}` : ""}<br>
     <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>${lead.phone ? ` · ${esc(lead.phone)}` : ""}<br>
     <a href="${esc(lead.website)}">${esc(lead.website)}</a></p>
     <p><b>Métier détecté :</b> ${esc(lead.trade ?? "à déterminer depuis le site")}${lead.site_title ? `<br><b>Site :</b> ${esc(lead.site_title)}` : ""}<br><b>Priorité :</b> ${esc(p.tag)} (intensité ${esc(lead.intensity)})${lead.secondary ? `<br><b>Signal secondaire :</b> ${esc(profiles[lead.secondary].tag)}` : ""}</p>
     ${lead.context ? `<p><b>Contexte fourni :</b><br>${esc(lead.context)}</p>` : ""}
     ${lead.utm ? `<p style="font-size:12px;color:#76766e">Source : ${esc(Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" · "))}</p>` : ""}
     ${btn(adminLeadUrl(lead), "Ouvrir le dossier")}
     <details><summary style="cursor:pointer">Toutes les réponses</summary><ul style="padding-left:18px;font-size:13px;line-height:1.6">${answers}</ul></details>
     <p style="font-size:12px;color:#76766e">Espace prospect : <a href="${esc(espaceUrl(lead))}">${esc(espaceUrl(lead))}</a></p>`,
  );
  return send(AGENCY_EMAIL, `[Carnet Plein] ${redo ? "Diagnostic refait" : "Nouveau lead"} : ${lead.company || lead.name} · ${p.tag}`, html, lead.email);
}

/** À l’agence : le prospect demande un créneau via le formulaire interne. */
export async function sendBookingRequestToAgency(lead: Lead) {
  if (!AGENCY_EMAIL || !lead.booking) return false;
  const b = lead.booking;
  const html = layout(
    `Demande de rendez-vous · ${esc(lead.company || lead.name)}`,
    `<p><b>${esc(lead.name)}</b> souhaite échanger ${esc(CALL.duration)}.</p>
     <p><b>Créneau souhaité :</b> ${esc(b.label ?? b.date)} à ${esc(b.time)} (heure de Paris)</p>
     ${b.message ? `<p><b>Message :</b><br>${esc(b.message)}</p>` : ""}
     <p><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>${lead.phone ? ` · ${esc(lead.phone)}` : ""}</p>
     ${btn(adminLeadUrl(lead), "Confirmer dans le dossier")}`,
  );
  return send(AGENCY_EMAIL, `[Carnet Plein] RDV demandé : ${lead.company || lead.name}`, html, lead.email);
}

/** Au prospect : confirmation de sa demande de créneau. */
export async function sendBookingRequestReceived(lead: Lead) {
  if (!lead.booking) return false;
  const b = lead.booking;
  const html = layout(
    `C’est noté, ${esc(lead.name.split(" ")[0])}.`,
    `<p>Vous avez demandé un échange de ${esc(CALL.duration)} <b>${esc(b.label ?? b.date)} à ${esc(b.time)}</b> (heure de Paris).</p>
     <p>Nous vous confirmons le créneau par retour d’e-mail. Si l’horaire ne convient plus, répondez simplement à ce message.</p>
     ${btn(espaceUrl(lead), "Revoir mon espace")}`,
  );
  return send(lead.email, "Votre demande de rendez-vous est bien reçue", html, AGENCY_EMAIL);
}

/** Au prospect : sa démo est prête. */
export async function sendDemoReady(lead: Lead) {
  if (!lead.demo_url) return false;
  const html = layout(
    `${esc(lead.name.split(" ")[0])}, votre démo est prête.`,
    `<p>Nous avons construit la version complète de votre tunnel de vente, à vos couleurs, à partir de votre diagnostic.</p>
     ${btn(lead.demo_url, "Découvrir ma démo")}
     <p>Regardez-la comme le ferait un de vos clients. Puis réservons ${esc(CALL.duration)} pour en parler : le lien est dans votre espace.</p>
     ${btn(espaceUrl(lead), "Ouvrir mon espace et réserver")}
     <p style="font-size:12px;color:#76766e">Si elle vous plaît : installation ${esc(PRICING.setup)}, puis ${esc(PRICING.monthly)}. ${esc(PRICING.footnote)}.</p>`,
  );
  return send(lead.email, "Votre démo Carnet Plein est prête", html, AGENCY_EMAIL);
}

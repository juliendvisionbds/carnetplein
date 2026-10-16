import { SITE } from "@/lib/content";
import { formatAnswer, questions, questionLabel } from "@/lib/diagnostic";
import type { Lead } from "@/lib/store";
import { getDictionary } from "@/i18n";
import { LOCALE_NAME, fmt, leadLocale, localePath } from "@/i18n/config";

/**
 * Envoi d’e-mails via Resend (API REST, sans SDK).
 * Si RESEND_API_KEY est absent, les envois sont ignorés et journalisés : l’app reste fonctionnelle.
 * Les e-mails au prospect sont écrits dans sa langue ; ceux à l’agence restent en français.
 */
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || `${SITE.name} <onboarding@resend.dev>`;
const AGENCY_EMAIL = process.env.AGENCY_NOTIFY_EMAIL;

const FR = getDictionary("fr");

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

function layout(lang: string, title: string, body: string, footer: string): string {
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f8f7f2;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#272727">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="font-weight:800;font-size:22px;letter-spacing:-1px;margin-bottom:24px">vision<span style="color:#8a83c6">.</span></div>
    <div style="background:#fffefa;border:1px solid #e2e2d8;border-radius:12px;padding:28px">
      <h1 style="font-size:24px;line-height:1.2;margin:0 0 16px;letter-spacing:-.8px">${title}</h1>
      ${body}
    </div>
    <p style="font-size:11px;color:#76766e;margin-top:20px">${esc(footer)}</p>
  </div></body></html>`;
}

const btn = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#272727;color:#fff;text-decoration:none;padding:14px 22px;border-radius:7px;font-weight:600">${esc(label)}</a></p>`;

/** Lien privé de l’espace prospect, dans la langue du prospect. */
export function espaceUrl(lead: Lead): string {
  return `${SITE.url}${localePath(leadLocale(lead.locale), `/espace/${lead.token}`)}`;
}

export function adminLeadUrl(lead: Lead): string {
  return `${SITE.url}/admin/leads/${lead.id}`;
}

const firstNameOf = (lead: Lead) => lead.name.split(" ")[0];

/** Au prospect : son diagnostic est prêt, lien vers son espace. */
export async function sendDiagnosticReady(lead: Lead) {
  const lang = leadLocale(lead.locale);
  const dict = getDictionary(lang);
  const t = dict.email.diagnosticReady;
  const p = dict.diagnostic.profiles[lead.priority];
  const name = esc(firstNameOf(lead));
  const html = layout(
    lang,
    fmt(t.title, { name }),
    `<p>${fmt(t.thanks, { tag: esc(p.tag) })}</p>
     <p style="color:#76766e">${esc(p.title)}</p>
     <p>${t.space}</p>
     ${btn(espaceUrl(lead), t.button)}
     <p>${fmt(t.now, { delay: esc(dict.demoDelay) })}</p>
     <p>${fmt(t.meanwhile, { duration: esc(dict.call.duration) })}</p>
     <p style="font-size:12px;color:#76766e">${t.keep}</p>`,
    dict.email.footer,
  );
  return send(lead.email, fmt(t.subject, { tag: p.tag }), html, AGENCY_EMAIL);
}

/** À l’agence (en français) : nouveau dossier avec synthèse des réponses. */
export async function sendNewLeadToAgency(lead: Lead, redo: boolean) {
  if (!AGENCY_EMAIL) return false;
  const d = FR.diagnostic;
  const p = d.profiles[lead.priority];
  const answers = questions
    .map((q) => `<li><span style="color:#76766e">${esc(questionLabel(q, d))}</span><br>${esc(formatAnswer(lead.answers, q.id, d))}</li>`)
    .join("");
  const html = layout(
    "fr",
    `${redo ? "Diagnostic refait" : "Nouveau diagnostic"} · ${esc(lead.company || lead.name)}`,
    `<p><b>${esc(lead.name)}</b>${lead.company ? ` · ${esc(lead.company)}` : ""}<br>
     <a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>${lead.phone ? ` · ${esc(lead.phone)}` : ""}<br>
     <a href="${esc(lead.website)}">${esc(lead.website)}</a></p>
     <p><b>Langue :</b> ${esc(LOCALE_NAME[leadLocale(lead.locale)])}<br><b>Métier détecté :</b> ${esc(lead.trade ?? "à déterminer depuis le site")}${lead.site_title ? `<br><b>Site :</b> ${esc(lead.site_title)}` : ""}<br><b>Priorité :</b> ${esc(p.tag)} (intensité ${esc(lead.intensity)})${lead.secondary ? `<br><b>Signal secondaire :</b> ${esc(d.profiles[lead.secondary].tag)}` : ""}</p>
     ${lead.context ? `<p><b>Contexte fourni :</b><br>${esc(lead.context)}</p>` : ""}
     ${lead.utm ? `<p style="font-size:12px;color:#76766e">Source : ${esc(Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" · "))}</p>` : ""}
     ${btn(adminLeadUrl(lead), "Ouvrir le dossier")}
     <details><summary style="cursor:pointer">Toutes les réponses</summary><ul style="padding-left:18px;font-size:13px;line-height:1.6">${answers}</ul></details>
     <p style="font-size:12px;color:#76766e">Espace prospect : <a href="${esc(espaceUrl(lead))}">${esc(espaceUrl(lead))}</a></p>`,
    FR.email.footer,
  );
  return send(AGENCY_EMAIL, `[${SITE.name}] ${redo ? "Diagnostic refait" : "Nouveau lead"} : ${lead.company || lead.name} · ${p.tag}`, html, lead.email);
}

/** À l’agence (en français) : le prospect demande un créneau via le formulaire interne. */
export async function sendBookingRequestToAgency(lead: Lead) {
  if (!AGENCY_EMAIL || !lead.booking) return false;
  const b = lead.booking;
  const html = layout(
    "fr",
    `Demande de rendez-vous · ${esc(lead.company || lead.name)}`,
    `<p><b>${esc(lead.name)}</b> souhaite échanger ${esc(FR.call.duration)} (langue : ${esc(LOCALE_NAME[leadLocale(lead.locale)])}).</p>
     <p><b>Créneau souhaité :</b> ${esc(b.label ?? b.date)} à ${esc(b.time)} (heure de Paris)</p>
     ${b.message ? `<p><b>Message :</b><br>${esc(b.message)}</p>` : ""}
     <p><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>${lead.phone ? ` · ${esc(lead.phone)}` : ""}</p>
     ${btn(adminLeadUrl(lead), "Confirmer dans le dossier")}`,
    FR.email.footer,
  );
  return send(AGENCY_EMAIL, `[${SITE.name}] RDV demandé : ${lead.company || lead.name}`, html, lead.email);
}

/** Au prospect : confirmation de sa demande de créneau. */
export async function sendBookingRequestReceived(lead: Lead) {
  if (!lead.booking) return false;
  const lang = leadLocale(lead.locale);
  const dict = getDictionary(lang);
  const t = dict.email.bookingReceived;
  const b = lead.booking;
  const html = layout(
    lang,
    fmt(t.title, { name: esc(firstNameOf(lead)) }),
    `<p>${fmt(t.text, { duration: esc(dict.call.duration), label: esc(b.label ?? b.date), time: esc(b.time) })}</p>
     <p>${t.confirm}</p>
     ${btn(espaceUrl(lead), t.button)}`,
    dict.email.footer,
  );
  return send(lead.email, t.subject, html, AGENCY_EMAIL);
}

/** Au prospect : sa démo est prête. */
export async function sendDemoReady(lead: Lead) {
  if (!lead.demo_url) return false;
  const lang = leadLocale(lead.locale);
  const dict = getDictionary(lang);
  const t = dict.email.demoReady;
  const html = layout(
    lang,
    fmt(t.title, { name: esc(firstNameOf(lead)) }),
    `<p>${t.text}</p>
     ${btn(lead.demo_url, t.button)}
     <p>${fmt(t.then, { duration: esc(dict.call.duration) })}</p>
     ${btn(espaceUrl(lead), t.bookButton)}
     <p style="font-size:12px;color:#76766e">${fmt(t.pricing, { setup: esc(dict.pricing.setup), monthly: esc(dict.pricing.monthly), footnote: esc(dict.pricing.footnote) })}</p>`,
    dict.email.footer,
  );
  return send(lead.email, t.subject, html, AGENCY_EMAIL);
}

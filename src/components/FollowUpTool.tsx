"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/i18n";
import { FOLLOW_UP_SITUATION_KEYS, fmt, type FollowUpSituation, type Locale } from "@/i18n/config";
import { FOLLOW_UP_ELAPSED, buildFollowUp, splitPlaceholders, type FollowUpCopy, type FollowUpElapsed, type FollowUpInput, type FollowUpMessage, type FollowUpResult, type FollowUpTrade } from "@/lib/follow-up";

/**
 * Générateur de relances de devis : le formulaire (colonne de droite du haut de page, à côté du texte
 * passé en enfant) et, dessous, le résultat : l’e-mail et le SMS à envoyer maintenant, modifiables,
 * la séquence de relance, puis l’appel au diagnostic.
 * Les messages sont assemblés dans le navigateur ; avec des détails sur le client (et l’IA activée),
 * l’API les fait réécrire, et la version standard reste affichée en cas d’échec.
 */

type ToolText = Pick<Dictionary["tools"]["followUp"], "form" | "result" | "bridge" | "example">;
type ResultText = ToolText["result"];

type Props = {
  lang: Locale;
  t: ToolText;
  copy: FollowUpCopy;
  trades: { key: FollowUpTrade; name: string }[];
  initial?: { trade?: FollowUpTrade; situation?: FollowUpSituation };
  aiEnabled: boolean;
  diagnosticHref: string;
  children: React.ReactNode;
};

type FormState = {
  trade: FollowUpTrade | "";
  situation: FollowUpSituation | "";
  elapsed: FollowUpElapsed | "";
  client: string;
  sender: string;
  company: string;
  project: string;
  details: string;
};

type Output = { result: FollowUpResult; message: FollowUpMessage; ai: "none" | "ok" | "failed"; run: number };

const DETAILS_MAX = 600;
const SMS_MAX = 320;

/** Copie un texte ; si le presse-papiers est refusé, rien ne casse (le texte reste sélectionnable à l’écran). */
export function CopyButton({ text, label, copied, className = "template-copy" }: { text: string; label: string; copied: string; className?: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2200);
    return () => clearTimeout(timer);
  }, [done]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      /* presse-papiers indisponible (contexte non sécurisé, navigateur intégré) */
    }
  }

  return (
    <button type="button" className={className} onClick={onCopy} aria-live="polite">
      {done ? copied : label}
    </button>
  );
}

/** Texte d’un message, les repères à compléter (« [date] ») surlignés. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {splitPlaceholders(text).map((part, i) =>
        part.placeholder ? (
          <mark className="ph" key={i}>
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

const hasPlaceholder = (text: string) => splitPlaceholders(text).some((part) => part.placeholder);

/** Un message en lecture seule avec son bouton de copie (séquence, pages de modèles). */
export function MessageView({ kind, label, subject, body, t }: { kind: "email" | "sms"; label: string; subject?: string; body: string; t: Pick<ResultText, "subject" | "copy" | "copied"> }) {
  return (
    <div className={`msg-view msg-${kind}`}>
      <div className="msg-view-head">
        <span className="msg-tag">{label}</span>
        <CopyButton text={body} label={t.copy} copied={t.copied} className="msg-copy" />
      </div>
      {subject && (
        <p className="msg-subject">
          <span>{t.subject}</span> <Highlighted text={subject} />
        </p>
      )}
      <p className="msg-text">
        <Highlighted text={body} />
      </p>
    </div>
  );
}

/** Message à envoyer maintenant : lecture surlignée, ou modification libre avant de copier. */
function MessageCard({ kind, t, label, subject, body, onChange }: { kind: "email" | "sms"; t: ResultText; label: string; subject?: string; body: string; onChange: (next: { subject?: string; body: string }) => void }) {
  const [editing, setEditing] = useState(false);
  const mailHref = kind === "email" ? `mailto:?subject=${encodeURIComponent(subject ?? "")}&body=${encodeURIComponent(body)}` : null;

  return (
    <article className={`msg-card msg-${kind}`}>
      <header className="msg-head">
        <span className="msg-tag">{label}</span>
        <div className="msg-actions">
          <button type="button" className="msg-copy" onClick={() => setEditing(!editing)} aria-pressed={editing}>
            {editing ? t.editDone : t.edit}
          </button>
          <CopyButton text={body} label={t.copy} copied={t.copied} className="msg-copy strong" />
        </div>
      </header>

      {subject !== undefined &&
        (editing ? (
          <label className="msg-subject editing">
            <span>{t.subject}</span>
            <input value={subject} onChange={(e) => onChange({ subject: e.target.value, body })} />
          </label>
        ) : (
          <div className="msg-subject">
            <span>{t.subject}</span> <Highlighted text={subject} />
            <CopyButton text={subject} label={t.copySubject} copied={t.copied} className="text-btn msg-subject-copy" />
          </div>
        ))}

      {editing ? (
        <textarea className="msg-edit" value={body} rows={kind === "sms" ? 5 : 14} onChange={(e) => onChange({ subject, body: e.target.value })} aria-label={label} />
      ) : (
        <p className="msg-text">
          <Highlighted text={body} />
        </p>
      )}

      <footer className="msg-foot">
        {hasPlaceholder(`${subject ?? ""} ${body}`) && <span className="msg-fill">{t.fill}</span>}
        {kind === "sms" && <span className={body.length > SMS_MAX ? "msg-count long" : "msg-count"}>{fmt(t.chars, { count: body.length })}</span>}
        {mailHref && (
          <a className="msg-mail" href={mailHref}>
            {t.openMail}
          </a>
        )}
      </footer>
    </article>
  );
}

function Sequence({ result, t }: { result: FollowUpResult; t: ResultText }) {
  return (
    <aside className="fu-sequence" aria-labelledby="fu-sequence-title">
      <h3 id="fu-sequence-title">{t.sequenceTitle}</h3>
      <p>{t.sequenceIntro}</p>
      <ol>
        {result.sequence.map((step) => (
          <li key={step.when} className={`fu-seq-step ${step.status}`}>
            <div className="fu-seq-when">
              <b>{step.when}</b>
              {step.status === "current" && <span className="badge lime">{t.youAreHere}</span>}
              {step.status === "done" && <span className="badge grey">{t.doneLabel}</span>}
            </div>
            <span className="fu-seq-goal">{step.goal}</span>
            <small>{step.channel}</small>
            {step.status !== "current" && (
              <details>
                <summary>{t.seeMessages}</summary>
                <MessageView kind="sms" label={t.sms} body={step.message.sms} t={t} />
                <MessageView kind="email" label={t.email} subject={step.message.subject} body={step.message.body} t={t} />
              </details>
            )}
          </li>
        ))}
      </ol>
      {result.revive && <p className="fu-revive-note">{t.reviveNote}</p>}
    </aside>
  );
}

export function FollowUpTool({ lang, t, copy, trades, initial, aiEnabled, diagnosticHref, children }: Props) {
  const [form, setForm] = useState<FormState>({
    trade: initial?.trade ?? "",
    situation: initial?.situation ?? "",
    elapsed: "",
    client: "",
    sender: "",
    company: "",
    project: "",
    details: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [pending, setPending] = useState(false);
  const [output, setOutput] = useState<Output | null>(null);
  const resultRef = useRef<HTMLElement>(null);
  const f = t.form;
  const r = t.result;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // Une fois le résultat affiché (ou remplacé), on l’amène à l’écran et on y place le focus.
  useEffect(() => {
    if (!output) return;
    const el = resultRef.current;
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [output?.run]);

  function loadExample() {
    setForm({
      trade: initial?.trade ?? "kitchens",
      situation: initial?.situation ?? "thinking",
      elapsed: "week",
      client: t.example.client,
      sender: t.example.sender,
      company: t.example.company,
      project: initial?.trade && initial.trade !== "kitchens" ? "" : t.example.project,
      details: aiEnabled ? t.example.details : "",
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trade || !form.situation || !form.elapsed || pending) return;
    const input: FollowUpInput = {
      trade: form.trade,
      situation: form.situation,
      elapsed: form.elapsed,
      client: form.client,
      sender: form.sender,
      company: form.company,
      project: form.project,
    };
    const result = buildFollowUp(copy, input);
    let message = result.current.message;
    let ai: Output["ai"] = "none";

    const details = form.details.trim();
    if (aiEnabled && details) {
      setPending(true);
      try {
        const res = await fetch("/api/tools/quote-follow-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: lang, ...input, details, website: honeypot }),
        });
        const data = (await res.json().catch(() => null)) as { message?: FollowUpMessage } | null;
        if (res.ok && data?.message) {
          message = data.message;
          ai = "ok";
        } else ai = "failed";
      } catch {
        ai = "failed";
      } finally {
        setPending(false);
      }
    }
    setOutput((prev) => ({ result, message, ai, run: (prev?.run ?? 0) + 1 }));
  }

  const editMessage = (next: Partial<FollowUpMessage>) => setOutput((prev) => (prev ? { ...prev, message: { ...prev.message, ...next } } : prev));
  const current = output?.result.current;

  return (
    <>
      <div className="tool-hero">
        <div className="tool-intro">{children}</div>

        <form className="tool-card" onSubmit={onSubmit} aria-label={f.aria}>
          <div className="tool-card-head">
            <span className="tool-label">{f.label}</span>
            <button type="button" className="text-btn" onClick={loadExample}>
              {f.example}
            </button>
          </div>

          <div className="field">
            <label htmlFor="fu-trade">{f.trade}</label>
            <select id="fu-trade" required value={form.trade} onChange={(e) => set("trade", e.target.value as FollowUpTrade)}>
              <option value="" disabled>
                {f.chooseTrade}
              </option>
              {trades.map((trade) => (
                <option key={trade.key} value={trade.key}>
                  {trade.name}
                </option>
              ))}
              <option value="other">{f.otherTrade}</option>
            </select>
          </div>

          <fieldset className="tool-fieldset">
            <legend>{f.situation}</legend>
            <div className="tool-choices">
              {FOLLOW_UP_SITUATION_KEYS.map((key) => (
                <label key={key} className="tool-choice">
                  <input type="radio" name="fu-situation" value={key} required checked={form.situation === key} onChange={() => set("situation", key)} />
                  <span>
                    <b>{copy.situations[key].label}</b>
                    <small>{copy.situations[key].hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="tool-fieldset">
            <legend>{f.elapsed}</legend>
            <div className="tool-chips">
              {FOLLOW_UP_ELAPSED.map((key) => (
                <label key={key} className="tool-chip">
                  <input type="radio" name="fu-elapsed" value={key} required checked={form.elapsed === key} onChange={() => set("elapsed", key)} />
                  <span>{f.elapsedOptions[key]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="tool-fieldset">
            <legend>
              {f.personal} <small>{f.optional}</small>
            </legend>
            <div className="tool-grid">
              <label className="field">
                {f.client}
                <input value={form.client} maxLength={60} autoComplete="off" placeholder={f.clientPlaceholder} onChange={(e) => set("client", e.target.value)} />
              </label>
              <label className="field">
                {f.sender}
                <input value={form.sender} maxLength={60} autoComplete="given-name" placeholder={f.senderPlaceholder} onChange={(e) => set("sender", e.target.value)} />
              </label>
              <label className="field">
                {f.company}
                <input value={form.company} maxLength={80} autoComplete="organization" placeholder={f.companyPlaceholder} onChange={(e) => set("company", e.target.value)} />
              </label>
              <label className="field">
                {f.project}
                <input value={form.project} maxLength={100} autoComplete="off" placeholder={f.projectPlaceholder} onChange={(e) => set("project", e.target.value)} />
              </label>
            </div>
          </fieldset>

          {aiEnabled && (
            <div className="field tool-details">
              <label htmlFor="fu-details">
                {f.details} <small>{f.optional}</small>
              </label>
              <textarea id="fu-details" rows={3} maxLength={DETAILS_MAX} value={form.details} placeholder={f.detailsPlaceholder} onChange={(e) => set("details", e.target.value)} aria-describedby="fu-details-help" />
              <small id="fu-details-help" className="tool-help">
                {f.detailsHelp} <span className="tool-count">{form.details.length} / {DETAILS_MAX}</span>
              </small>
            </div>
          )}

          {/* Champ piège : invisible pour les visiteurs, rempli par les robots (l’API ignore alors la demande). */}
          <input className="hp" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />

          <button className="btn block" type="submit" disabled={pending}>
            {pending ? f.submitting : f.submit} <span aria-hidden="true">→</span>
          </button>
          <p className="micro tool-privacy">{aiEnabled ? f.privacyAi : f.privacy}</p>
        </form>
      </div>

      <section className="tool-result" id="result" ref={resultRef} tabIndex={-1} aria-labelledby="fu-result-title" aria-busy={pending}>
        {output && current ? (
          <>
            <div className="tool-result-head">
              <div>
                <div className="eyebrow">{r.now}</div>
                <h2 id="fu-result-title">
                  {current.when} · {current.goal}
                </h2>
                <p>{fmt(r.channel, { channel: current.channel })}</p>
              </div>
              {output.ai === "ok" && <span className="badge purple lg">✦ {r.ai}</span>}
            </div>
            {output.ai === "failed" && <p className="notice">{r.aiFailed}</p>}
            <div className="tool-result-grid">
              <div className={current.smsFirst ? "tool-messages sms-first" : "tool-messages"}>
                <MessageCard kind="email" t={r} label={r.email} subject={output.message.subject} body={output.message.body} onChange={({ subject, body }) => editMessage({ subject: subject ?? "", body })} />
                <MessageCard kind="sms" t={r} label={r.sms} body={output.message.sms} onChange={({ body }) => editMessage({ sms: body })} />
              </div>
              <Sequence result={output.result} t={r} />
            </div>
            <div className="meta-band compact tool-bridge">
              <div>
                <div className="eyebrow">{t.bridge.eyebrow}</div>
                <h2>{t.bridge.title}</h2>
                <p>{t.bridge.text}</p>
                <Link className="btn" href={diagnosticHref}>
                  {t.bridge.cta}
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="tool-empty">
            <h2 id="fu-result-title">{r.emptyTitle}</h2>
            <p>{r.emptyText}</p>
          </div>
        )}
      </section>
    </>
  );
}

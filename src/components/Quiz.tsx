"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_SOURCES, UNKNOWN, isAnswered, optionLabel, questions, questionText, resolveOpts, type Answers } from "@/lib/diagnostic";
import { LEAD_TOKEN_KEY, QUIZ_STATE_KEY, SKIP_RESUME_KEY, UTM_KEY, readJSON, writeJSON } from "@/lib/client-storage";
import { toast } from "@/components/Toaster";
import { fmt, localePath, type Locale } from "@/i18n/config";
import type { Dictionary, DiagnosticDictionary } from "@/i18n";

type Contact = { name: string; email: string; website: string; consent: boolean };
type QuizState = { answers: Answers; step: number; contact: Contact };
type Props = { lang: Locale; t: Dictionary["quiz"]; d: DiagnosticDictionary };

const emptyContact: Contact = { name: "", email: "", website: "", consent: false };
const initial: QuizState = { answers: {}, step: 0, contact: emptyContact };
const TOTAL = questions.length + 1; // 9 questions + coordonnées

export function Quiz({ lang, t, d }: Props) {
  const router = useRouter();
  const [state, setState] = useState<QuizState>(initial);
  const [mounted, setMounted] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Le drapeau « ne pas proposer la reprise » est consommé une seule fois, même si l’effet
  // s’exécute deux fois (mode strict de React en développement).
  const skipResumeRef = useRef<boolean | null>(null);

  useEffect(() => {
    const saved = readJSON<QuizState | null>(QUIZ_STATE_KEY, null);
    if (saved) setState({ ...initial, ...saved, contact: { ...emptyContact, ...saved.contact }, step: Math.min(saved.step ?? 0, TOTAL - 1) });
    let token: string | null = null;
    try {
      token = localStorage.getItem(LEAD_TOKEN_KEY);
      if (skipResumeRef.current === null) {
        skipResumeRef.current = sessionStorage.getItem(SKIP_RESUME_KEY) === "1";
        sessionStorage.removeItem(SKIP_RESUME_KEY);
      }
    } catch {
      /* stockage indisponible */
    }
    setExistingToken(token);
    setShowResume(Boolean(token) && !skipResumeRef.current);
    setMounted(true);
  }, []);

  const update = (patch: Partial<QuizState> | ((s: QuizState) => Partial<QuizState>)) => {
    setState((s) => {
      const next = { ...s, ...(typeof patch === "function" ? patch(s) : patch) };
      writeJSON(QUIZ_STATE_KEY, next);
      return next;
    });
  };

  const step = state.step;
  const isContactStep = step === questions.length;
  const q = isContactStep ? null : questions[step];
  const opts = useMemo(() => (q ? resolveOpts(q, state.answers) : []), [q, state.answers]);
  const section = isContactStep ? 3 : q!.section;
  const canContinue = isContactStep ? true : isAnswered(q!, state.answers);
  const text = q ? questionText(q, state.answers, d) : null;

  function choose(value: string) {
    if (!q) return;
    update((s) => {
      const answers: Answers = { ...s.answers };
      if (q.type === "multi") {
        let values = Array.isArray(answers.source) ? [...answers.source] : [];
        if (values.includes(value)) values = values.filter((v) => v !== value);
        else if (value === UNKNOWN) values = [value];
        else {
          values = values.filter((v) => v !== UNKNOWN);
          if (values.length === MAX_SOURCES) {
            toast(fmt(t.maxSources, { max: MAX_SOURCES }));
            return {};
          }
          values.push(value);
        }
        answers.source = values;
      } else {
        if (q.id === "qual" && answers.qual !== value) delete answers.detail;
        (answers as Record<string, unknown>)[q.id] = value;
      }
      return { answers };
    });
  }

  function next() {
    if (!canContinue) return;
    update({ step: Math.min(step + 1, TOTAL - 1) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    if (step > 0) update({ step: step - 1 });
    else router.push(localePath(lang, "/"));
  }

  function restart() {
    update({ ...initial });
    setShowResume(false);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const c = state.contact;
    if (!c.consent) {
      setError(t.consentRequired);
      return;
    }
    setSubmitting(true);
    const fax = (new FormData(e.currentTarget).get("fax") as string) || "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: lang,
          answers: state.answers,
          contact: c,
          utm: readJSON<Record<string, string> | null>(UTM_KEY, null) ?? undefined,
          fax,
        }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error || t.genericError);
      try {
        localStorage.setItem(LEAD_TOKEN_KEY, data.token);
        localStorage.removeItem(QUIZ_STATE_KEY);
      } catch {
        /* stockage indisponible : le lien reste dans l’e-mail */
      }
      router.push(localePath(lang, `/espace/${data.token}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="quiz-layout">
        <aside className="quiz-aside" />
        <section className="quiz-card" aria-busy="true">
          <p>{t.loading}</p>
        </section>
      </div>
    );
  }

  if (showResume && existingToken) {
    return (
      <div className="resume">
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          {t.resumeEyebrow}
        </div>
        <h2 style={{ margin: "16px 0" }}>{t.resumeTitle}</h2>
        <p>{t.resumeText}</p>
        <div className="actions">
          <Link className="btn" href={localePath(lang, `/espace/${existingToken}`)}>
            {t.openSpace}
          </Link>
          <button className="btn outline" onClick={restart}>
            {t.redo}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-layout">
      <aside className="quiz-aside">
        <div className="eyebrow">{t.asideEyebrow}</div>
        <h3>
          {t.asideTitleA}
          <br />
          {t.asideTitleB}
        </h3>
        <p>{t.asideText}</p>
        {d.sections.map((label, n) => (
          <div key={label} className={`quiz-step ${section === n ? "active" : section > n ? "done" : ""}`}>
            <span>{section > n ? "✓" : `0${n + 1}`}</span>
            {label}
          </div>
        ))}
        <div className="info-badge" role="note">
          <i aria-hidden="true">i</i>
          <span>{t.savedNote}</span>
        </div>
      </aside>

      <section className="quiz-card">
        <div className="quiz-meta">
          <span>{d.sections[section]}</span>
          <span>
            {step + 1} / {TOTAL}
          </span>
        </div>
        <div className="progress">
          <div style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>

        {q && text ? (
          <>
            <h2>{text.title}</h2>
            <p>{text.help}</p>

            {q.id === "response" && (
              <>
                <label className="check auto-confirm">
                  <input
                    type="checkbox"
                    checked={Boolean(state.answers.autoConfirm)}
                    onChange={(e) => update((s) => ({ answers: { ...s.answers, autoConfirm: e.target.checked } }))}
                  />
                  <span>{t.autoConfirm}</span>
                </label>
                <p className="micro">{t.autoConfirmThen}</p>
              </>
            )}

            <div className={`options ${q.type === "multi" ? "multi-options" : ""}`} role="group">
              {opts.map((key) => {
                const selected = q.type === "multi" ? (state.answers.source ?? []).includes(key) : state.answers[q.id] === key;
                return (
                  <button key={key} type="button" className={`option ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => choose(key)}>
                    {optionLabel(d, q.id, key)}
                  </button>
                );
              })}
            </div>
            {q.type === "multi" && (
              <div className="micro" aria-live="polite">
                {fmt(t.sourcesSelected, { n: (state.answers.source ?? []).length, max: MAX_SOURCES })}
              </div>
            )}

            <div className="quiz-actions">
              <button type="button" className="text-btn" onClick={previous}>
                ← {step ? t.back : t.home}
              </button>
              <button type="button" className="btn" onClick={next} disabled={!canContinue}>
                {t.next}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            <h2>{t.contactTitle}</h2>
            <p>{t.contactIntro}</p>
            <div className="form-grid">
              <label className="field">
                {t.name}
                <input
                  name="name"
                  required
                  autoComplete="name"
                  autoFocus
                  value={state.contact.name}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, name: e.target.value } }))}
                />
              </label>
              <label className="field">
                {t.email}
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={state.contact.email}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, email: e.target.value } }))}
                />
              </label>
              <label className="field full">
                {t.website}
                <input
                  name="website"
                  required
                  inputMode="url"
                  autoComplete="url"
                  placeholder={t.websitePlaceholder}
                  value={state.contact.website}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, website: e.target.value } }))}
                />
              </label>
              <input type="text" name="fax" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1 }} />
            </div>
            <label className="check">
              <input
                type="checkbox"
                required
                checked={state.contact.consent}
                onChange={(e) => update((s) => ({ contact: { ...s.contact, consent: e.target.checked } }))}
              />
              <span>{t.consent}</span>
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="quiz-actions">
              <button type="button" className="text-btn" onClick={previous} disabled={submitting}>
                ← {t.back}
              </button>
              <button type="submit" className="btn lime" disabled={submitting}>
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
            <div className="contact-intro">
              <span aria-hidden="true">✦</span>
              <div>
                <b>{t.thenTitle}</b>
                {t.thenText}
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

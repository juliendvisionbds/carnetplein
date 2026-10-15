"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  SECTIONS,
  isAnswered,
  profiles,
  diagnose,
  questions,
  resolve,
  type Answers,
} from "@/lib/diagnostic";
import { LEAD_TOKEN_KEY, QUIZ_STATE_KEY, SKIP_RESUME_KEY, UTM_KEY, readJSON, writeJSON } from "@/lib/client-storage";
import { toast } from "@/components/Toaster";

type Contact = { name: string; company: string; email: string; website: string; phone: string; context: string; consent: boolean };
type QuizState = { answers: Answers; step: number; contact: Contact };

const emptyContact: Contact = { name: "", company: "", email: "", website: "", phone: "", context: "", consent: false };
const initial: QuizState = { answers: {}, step: 0, contact: emptyContact };
const TOTAL = questions.length + 1; // 10 questions + coordonnées

export function Quiz() {
  const router = useRouter();
  const [state, setState] = useState<QuizState>(initial);
  const [mounted, setMounted] = useState(false);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = readJSON<QuizState | null>(QUIZ_STATE_KEY, null);
    if (saved) setState({ ...initial, ...saved, contact: { ...emptyContact, ...saved.contact }, step: Math.min(saved.step ?? 0, TOTAL - 1) });
    let token: string | null = null;
    let skipResume = false;
    try {
      token = localStorage.getItem(LEAD_TOKEN_KEY);
      skipResume = sessionStorage.getItem(SKIP_RESUME_KEY) === "1";
      sessionStorage.removeItem(SKIP_RESUME_KEY);
    } catch {
      /* stockage indisponible */
    }
    setExistingToken(token);
    setShowResume(Boolean(token) && !skipResume);
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
  const opts = useMemo(() => (q ? resolve(q.opts, state.answers) : []), [q, state.answers]);
  const section = isContactStep ? 3 : q!.section;
  const canContinue = isContactStep ? true : isAnswered(q!, state.answers);

  function choose(value: string) {
    if (!q) return;
    update((s) => {
      const answers: Answers = { ...s.answers };
      if (q.type === "multi") {
        let values = Array.isArray(answers.source) ? [...answers.source] : [];
        if (values.includes(value)) values = values.filter((v) => v !== value);
        else if (value === "Je ne sais pas") values = [value];
        else {
          values = values.filter((v) => v !== "Je ne sais pas");
          if (values.length === 3) {
            toast("Vous pouvez sélectionner jusqu’à 3 sources.");
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
    else router.push("/");
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
      setError("Votre accord est nécessaire pour vous envoyer le diagnostic.");
      return;
    }
    setSubmitting(true);
    const fax = (new FormData(e.currentTarget).get("fax") as string) || "";
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: state.answers,
          contact: { ...c, company: c.company || undefined, phone: c.phone || undefined, context: c.context || undefined },
          utm: readJSON<Record<string, string> | null>(UTM_KEY, null) ?? undefined,
          fax,
        }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error || "Une erreur est survenue.");
      try {
        localStorage.setItem(LEAD_TOKEN_KEY, data.token);
        localStorage.removeItem(QUIZ_STATE_KEY);
      } catch {
        /* stockage indisponible : le lien reste dans l’e-mail */
      }
      router.push(`/espace/${data.token}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  if (!mounted) {
    return (
      <div className="quiz-layout">
        <aside className="quiz-aside" />
        <section className="quiz-card" aria-busy="true">
          <p>Chargement de votre diagnostic…</p>
        </section>
      </div>
    );
  }

  if (showResume && existingToken) {
    return (
      <div className="resume">
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          Vous êtes déjà passé par ici
        </div>
        <h2 style={{ margin: "16px 0" }}>Votre diagnostic vous attend.</h2>
        <p>Retrouvez votre priorité, vos trois actions et la suite dans votre espace. Ou refaites le diagnostic si votre situation a changé.</p>
        <div className="actions">
          <Link className="btn" href={`/espace/${existingToken}`}>
            Ouvrir mon espace ↗
          </Link>
          <button className="btn outline" onClick={restart}>
            Refaire le diagnostic
          </button>
        </div>
      </div>
    );
  }

  const preview = isContactStep ? profiles[diagnose(state.answers).key] : null;

  return (
    <div className="quiz-layout">
      <aside className="quiz-aside">
        <div className="eyebrow">Votre diagnostic</div>
        <h3>
          On commence
          <br />
          par vous écouter.
        </h3>
        <p>Pas de mauvaise réponse. Le but est de comprendre votre quotidien.</p>
        {SECTIONS.map((label, n) => (
          <div key={label} className={`quiz-step ${section === n ? "active" : section > n ? "done" : ""}`}>
            <span>{section > n ? "✓" : `0${n + 1}`}</span>
            {label}
          </div>
        ))}
        <div className="info-badge" role="note">
          <i aria-hidden="true">↻</i>
          <span>Vos réponses sont enregistrées au fil de l’eau : vous pouvez revenir plus tard.</span>
        </div>
      </aside>

      <section className="quiz-card">
        <div className="quiz-meta">
          <span>{SECTIONS[section]}</span>
          <span>
            {step + 1} / {TOTAL}
          </span>
        </div>
        <div className="progress">
          <div style={{ width: `${((step + 1) / TOTAL) * 100}%` }} />
        </div>

        {q ? (
          <>
            <h2>{resolve(q.title, state.answers)}</h2>
            <p>{resolve(q.help, state.answers)}</p>

            {q.id === "response" && (
              <>
                <label className="check auto-confirm">
                  <input
                    type="checkbox"
                    checked={Boolean(state.answers.autoConfirm)}
                    onChange={(e) => update((s) => ({ answers: { ...s.answers, autoConfirm: e.target.checked } }))}
                  />
                  <span>Un e-mail de confirmation automatique est envoyé juste après la demande.</span>
                </label>
                <p className="micro">Et pour votre réponse personnelle :</p>
              </>
            )}

                            <div className={`options ${q.type === "multi" ? "multi-options" : ""}`} role="group">
                  {opts.map((x) => {
                    const selected = q.type === "multi" ? (state.answers.source ?? []).includes(x) : state.answers[q.id] === x;
                    return (
                      <button key={x} type="button" className={`option ${selected ? "selected" : ""}`} aria-pressed={selected} onClick={() => choose(x)}>
                        {x}
                      </button>
                    );
                  })}
                </div>
                {q.type === "multi" && (
                  <div className="micro" aria-live="polite">
                    {(state.answers.source ?? []).length} / 3 sources sélectionnées
                  </div>
                )}

            <div className="quiz-actions">
              <button type="button" className="text-btn" onClick={previous}>
                ← {step ? "Précédent" : "Accueil"}
              </button>
              <button type="button" className="btn" onClick={next} disabled={!canContinue}>
                Continuer →
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} noValidate={false}>
            <h2>Dernière étape : où vous envoyer votre diagnostic ?</h2>
            <p>
              Votre priorité est prête{preview ? <> : <b>{preview.tag}</b></> : null}. Vos coordonnées nous permettent de vous l’envoyer, puis de
              construire la démo de votre tunnel de vente à partir de vos réponses.
            </p>
            <div className="form-grid">
              <label className="field">
                Votre prénom et nom *
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
                Votre e-mail professionnel *
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
                Le site ou la page de votre entreprise *
                <input
                  name="website"
                  required
                  inputMode="url"
                  autoComplete="url"
                  placeholder="www.votre-entreprise.fr, ou votre page Google / Instagram"
                  value={state.contact.website}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, website: e.target.value } }))}
                />
              </label>
              <label className="field">
                Votre entreprise
                <input
                  name="company"
                  autoComplete="organization"
                  value={state.contact.company}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, company: e.target.value } }))}
                />
              </label>
              <label className="field">
                Votre téléphone
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={state.contact.phone}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, phone: e.target.value } }))}
                />
              </label>
              <label className="field full">
                Un détail utile pour votre démo ?
                <textarea
                  name="context"
                  rows={2}
                  placeholder="Votre zone, vos outils actuels, ce que vous aimeriez voir…"
                  value={state.contact.context}
                  onChange={(e) => update((s) => ({ contact: { ...s.contact, context: e.target.value } }))}
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
              <span>
                J’accepte de recevoir mon diagnostic, la démo de mon tunnel de vente et d’être recontacté à ce sujet.{" "}
                <Link href="/confidentialite" target="_blank" style={{ textDecoration: "underline" }}>
                  Confidentialité
                </Link>
              </span>
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="quiz-actions">
              <button type="button" className="text-btn" onClick={previous} disabled={submitting}>
                ← Précédent
              </button>
              <button type="submit" className="btn lime" disabled={submitting}>
                {submitting ? "Analyse de vos réponses…" : "Voir mon diagnostic →"}
              </button>
            </div>
            <div className="contact-intro">
              <span aria-hidden="true">✦</span>
              <div>
                <b>Et ensuite ?</b>
                Vous accédez immédiatement à votre diagnostic. Pendant ce temps, on construit la démo complète de votre tunnel de vente, à vos
                couleurs, et on vous l’envoie.
              </div>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

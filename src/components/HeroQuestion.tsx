"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SECTIONS, questions, resolve } from "@/lib/diagnostic";
import { QUIZ_STATE_KEY, SKIP_RESUME_KEY, writeJSON } from "@/lib/client-storage";

const TOTAL = questions.length + 1;
const first = questions[0];

/** La première question du diagnostic, directement dans le hero : un clic et le visiteur est dans le parcours. */
export function HeroQuestion() {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);
  const opts = resolve(first.opts, {});

  function choose(value: string) {
    setChosen(value);
    writeJSON(QUIZ_STATE_KEY, { answers: { [first.id]: value }, step: 1, contact: {} });
    try {
      sessionStorage.setItem(SKIP_RESUME_KEY, "1");
    } catch {
      /* stockage indisponible : le diagnostic repart simplement de la question 1 */
    }
    router.push("/diagnostic");
  }

  return (
    <div className="hero-art hero-quiz" aria-label="Première question du diagnostic">
      <div className="art-label">Votre diagnostic commence ici</div>
      <div className="quiz-card">
        <div className="quiz-meta">
          <span>{SECTIONS[first.section]}</span>
          <span>1 / {TOTAL}</span>
        </div>
        <div className="progress">
          <div style={{ width: `${(1 / TOTAL) * 100}%` }} />
        </div>
        <h2>{resolve(first.title, {})}</h2>
        <p>{resolve(first.help, {})}</p>
        <div className="options" role="group" aria-label={resolve(first.title, {})}>
          {opts.map((x) => (
            <button key={x} type="button" className={`option ${chosen === x ? "selected" : ""}`} aria-pressed={chosen === x} onClick={() => choose(x)}>
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="sticker" aria-hidden="true">
        3 minutes
        <small>Résultat immédiat</small>
      </div>
      <div className="micro">Gratuit · Puis la démo de votre tunnel, à vos couleurs</div>
    </div>
  );
}

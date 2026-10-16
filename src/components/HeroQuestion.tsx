"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { questions } from "@/lib/diagnostic";
import { QUIZ_STATE_KEY, SKIP_RESUME_KEY, writeJSON } from "@/lib/client-storage";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

export type HeroQuestionData = {
  section: string;
  title: string;
  help: string;
  options: { key: string; label: string }[];
  total: number;
};

type Props = { lang: Locale; t: Dictionary["hero"]; question: HeroQuestionData };

const first = questions[0];

/** La première question du diagnostic, directement dans le hero : un clic et le visiteur est dans le parcours. */
export function HeroQuestion({ lang, t, question }: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);

  function choose(value: string) {
    setChosen(value);
    writeJSON(QUIZ_STATE_KEY, { answers: { [first.id]: value }, step: 1, contact: {} });
    try {
      sessionStorage.setItem(SKIP_RESUME_KEY, "1");
    } catch {
      /* stockage indisponible : le diagnostic repart simplement de la question 1 */
    }
    router.push(localePath(lang, "/diagnostic"));
  }

  return (
    <div className="hero-art hero-quiz" aria-label={t.aria}>
      <div className="art-label">{t.label}</div>
      <div className="quiz-card">
        <div className="quiz-meta">
          <span>{question.section}</span>
          <span>1 / {question.total}</span>
        </div>
        <div className="progress">
          <div style={{ width: `${(1 / question.total) * 100}%` }} />
        </div>
        <h2>{question.title}</h2>
        <p>{question.help}</p>
        <div className="options" role="group" aria-label={question.title}>
          {question.options.map((o) => (
            <button key={o.key} type="button" className={`option ${chosen === o.key ? "selected" : ""}`} aria-pressed={chosen === o.key} onClick={() => choose(o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="sticker" aria-hidden="true">
        {t.stickerBig}
        <small>{t.stickerSmall}</small>
      </div>
      <div className="micro">{t.micro}</div>
    </div>
  );
}

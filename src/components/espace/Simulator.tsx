"use client";

import { useState } from "react";
import { INTL_TAG, fmt, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = { volume: number; now: number; target: number; lang: Locale; t: Dictionary["simulator"] };

/** Simulation simple : clients supplémentaires par mois à volume constant. */
export function Simulator({ volume, now, target, lang, t }: Props) {
  const [v, setV] = useState(volume);
  const [n, setN] = useState(now);
  const [g, setG] = useState(target);

  const invalid = v < 0 || v > 100000 || n < 0 || n > 100 || g < 0 || g > 100 || [v, n, g].some(Number.isNaN);
  const delta = (v * (g - n)) / 100;
  const result = invalid
    ? t.invalid
    : fmt(t.result, { delta: `${g >= n ? "+" : ""}${delta.toLocaleString(INTL_TAG[lang], { maximumFractionDigits: 1 })}` });

  const num = (set: (x: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value));

  return (
    <div className="scenario">
      <h4>{t.title}</h4>
      <p>{t.intro}</p>
      <label>
        {t.volume} <input type="number" min={0} max={100000} value={v} onChange={num(setV)} />
      </label>
      <label>
        {t.now} <input type="number" min={0} max={100} value={n} onChange={num(setN)} />
      </label>
      <label>
        {t.target} <input type="number" min={0} max={100} value={g} onChange={num(setG)} />
      </label>
      <strong aria-live="polite">{result}</strong>
      <p>{t.note}</p>
    </div>
  );
}

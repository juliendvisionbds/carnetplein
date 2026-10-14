"use client";

import { useState } from "react";

type Props = { volume: number; now: number; target: number };

/** Simulation simple : clients supplémentaires par mois à volume constant. */
export function Simulator(defaults: Props) {
  const [v, setV] = useState(defaults.volume);
  const [n, setN] = useState(defaults.now);
  const [t, setT] = useState(defaults.target);

  const invalid = v < 0 || v > 100000 || n < 0 || n > 100 || t < 0 || t > 100 || [v, n, t].some(Number.isNaN);
  const delta = (v * (t - n)) / 100;
  const result = invalid
    ? "Vérifiez les valeurs saisies."
    : `${t >= n ? "+" : ""}${delta.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} client(s) / mois`;

  const num = (set: (x: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(Number(e.target.value));

  return (
    <div className="scenario">
      <h4>Et si votre conversion progressait ?</h4>
      <p>Une simple simulation à partir de vos réponses, pas une prévision. Ajustez les hypothèses à vos chiffres.</p>
      <label>
        Demandes par mois <input type="number" min={0} max={100000} value={v} onChange={num(setV)} />
      </label>
      <label>
        Conversion actuelle (%) <input type="number" min={0} max={100} value={n} onChange={num(setN)} />
      </label>
      <label>
        Hypothèse à tester (%) <input type="number" min={0} max={100} value={t} onChange={num(setT)} />
      </label>
      <strong aria-live="polite">{result}</strong>
      <p>À volume constant, sous ces hypothèses uniquement.</p>
    </div>
  );
}

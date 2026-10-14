"use client";

import { useState } from "react";
import { promptFor } from "@/lib/trades";
import { track } from "./track";

const HORIZONS = ["Dans les 3 mois", "Dans les 6 à 12 mois", "Je me renseigne pour le moment"];

/** Un avant-goût, dans le rôle du client : la prise de contact que vivront ses prospects. */
export function ClientPreview({ token, trade, company }: { token: string; trade: string | null; company: string }) {
  const prompt = promptFor(trade);
  const [first, setFirst] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<number | null>(null);

  const summary =
    horizon === 0
      ? "Votre calendrier est proche. La prochaine étape est de vérifier les contraintes et les disponibilités avec un conseiller."
      : horizon === 1
        ? "Vous avez le temps de préparer votre projet. Clarifions les contraintes et les grandes étapes avant le devis."
        : "Vous explorez encore les possibilités. Un premier échange peut vous aider à préciser le besoin sans vous engager.";

  return (
    <div className="panel preview-box">
      <div className="eyebrow">Un avant-goût · Vous êtes votre client</div>
      <h3 style={{ marginTop: 16 }}>{prompt.title}</h3>
      <p style={{ fontSize: 13 }}>
        {company} · La prise de contact que vivront vos prospects. Cliquez, comme eux.
        {!trade && " Votre démo reprendra les mots de votre métier."}
      </p>
      {horizon !== null ? (
        <div className="panel lavender">
          <span className="badge purple">Votre projet, en quelques mots</span>
          <h4 style={{ marginTop: 14 }}>{first}</h4>
          <p style={{ fontSize: 13 }}>{summary}</p>
          <p className="micro">
            Dans votre démo : vos couleurs, vos photos, vos mots, et un accusé de réception immédiat pour votre client.{" "}
            <button
              type="button"
              className="text-btn"
              onClick={() => {
                setFirst(null);
                setHorizon(null);
              }}
            >
              Rejouer
            </button>
          </p>
        </div>
      ) : first ? (
        <>
          <span className="badge purple">{first}</span>
          <h4 style={{ marginTop: 18 }}>À quel horizon souhaitez-vous avancer ?</h4>
          <div className="options">
            {HORIZONS.map((h, n) => (
              <button
                key={h}
                type="button"
                className="option"
                onClick={() => {
                  setHorizon(n);
                  track(token, "preview_played");
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h4>{prompt.question}</h4>
          <div className="options">
            {prompt.options.map((o) => (
              <button key={o} type="button" className="option" onClick={() => setFirst(o)}>
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

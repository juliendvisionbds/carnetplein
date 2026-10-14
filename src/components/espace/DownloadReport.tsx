"use client";

import { track } from "./track";

type Props = { token: string; content: string; className?: string; label?: string };

/** Génère la synthèse texte côté navigateur et la propose au téléchargement. */
export function DownloadReport({ token, content, className = "text-btn", label = "Télécharger ma synthèse ↓" }: Props) {
  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    a.download = "carnet-plein-mon-diagnostic.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track(token, "report_downloaded");
  }
  return (
    <button type="button" className={className} onClick={download}>
      {label}
    </button>
  );
}

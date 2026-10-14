"use client";

export type TrackType = "espace_viewed" | "booking_viewed" | "demo_opened" | "report_downloaded" | "preview_played";

/** Envoie un événement d’usage ; silencieux en cas d’échec. `once` évite les doublons dans la session. */
export function track(token: string, type: TrackType, once = true) {
  try {
    const key = `cp-ev-${token}-${type}`;
    if (once && sessionStorage.getItem(key)) return;
    if (once) sessionStorage.setItem(key, "1");
  } catch {
    /* sessionStorage indisponible : on envoie quand même */
  }
  fetch(`/api/leads/${token}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type }),
    keepalive: true,
  }).catch(() => undefined);
}

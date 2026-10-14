"use client";

import { useEffect } from "react";
import { UTM_KEY } from "@/lib/client-storage";

/** Mémorise la source d’acquisition (utm_*, referrer) à la première visite, pour l’attacher au dossier. */
export function UtmCapture() {
  useEffect(() => {
    try {
      if (localStorage.getItem(UTM_KEY)) return;
      const params = new URLSearchParams(window.location.search);
      const utm: Record<string, string> = {};
      for (const [k, v] of params) if (k.startsWith("utm_") && v) utm[k] = v.slice(0, 120);
      if (document.referrer) {
        try {
          const ref = new URL(document.referrer);
          if (ref.host !== window.location.host) utm.referrer = ref.host;
        } catch {
          /* referrer illisible : ignoré */
        }
      }
      utm.landing = window.location.pathname;
      localStorage.setItem(UTM_KEY, JSON.stringify(utm));
    } catch {
      /* stockage indisponible : on continue sans attribution */
    }
  }, []);
  return null;
}

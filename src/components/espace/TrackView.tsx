"use client";

import { useEffect } from "react";
import { LEAD_TOKEN_KEY } from "@/lib/client-storage";
import { track } from "./track";

/** Journalise l’ouverture de l’espace et mémorise le lien pour le bouton « Mon espace ». */
export function TrackView({ token }: { token: string }) {
  useEffect(() => {
    try {
      localStorage.setItem(LEAD_TOKEN_KEY, token);
    } catch {
      /* stockage indisponible */
    }
    track(token, "espace_viewed");
  }, [token]);
  return null;
}

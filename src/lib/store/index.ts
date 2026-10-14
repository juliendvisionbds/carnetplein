import type { LeadStore } from "./types";
import { SupabaseLeadStore } from "./supabase";
import { FileLeadStore } from "./file";

export type { Lead, LeadEvent, LeadNote, NewLead, Booking, LeadStore } from "./types";

let instance: LeadStore | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Sélection du stockage :
 *  - Supabase dès que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis ;
 *  - sinon, en développement uniquement, un fichier JSON local (.data/leads.json).
 */
export function getStore(): LeadStore {
  if (instance) return instance;
  if (isSupabaseConfigured()) {
    instance = new SupabaseLeadStore(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  } else if (process.env.NODE_ENV !== "production") {
    console.warn("[carnet-plein] Supabase non configuré : stockage local .data/leads.json (développement).");
    instance = new FileLeadStore();
  } else {
    throw new Error(
      "Supabase n’est pas configuré. Définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d’environnement Vercel.",
    );
  }
  return instance;
}

import type { Answers, Intensity, ProfileKey, ScoredKey, Stage } from "@/lib/diagnostic";
import type { Locale } from "@/i18n/config";

export type Booking = {
  /** "embed" si pris via Cal.com/Calendly, "request" si demandé via le formulaire interne. */
  kind: "embed" | "request";
  date?: string;
  time?: string;
  label?: string;
  message?: string;
  at: string;
};

export type Lead = {
  id: string;
  token: string;
  created_at: string;
  updated_at: string;
  /** Langue du prospect : espace, e-mails et synthèse PDF lui sont servis dans cette langue. */
  locale: Locale;
  name: string;
  email: string;
  company: string | null;
  website: string;
  phone: string | null;
  context: string | null;
  /** Métier détecté depuis le site (ou corrigé dans le pilotage), libellé français canonique. */
  trade: string | null;
  site_title: string | null;
  site_description: string | null;
  answers: Answers;
  priority: ProfileKey;
  secondary: ScoredKey | null;
  intensity: Intensity;
  stage: Stage;
  demo_url: string | null;
  booking: Booking | null;
  utm: Record<string, string> | null;
  consent_at: string;
  last_seen_at: string | null;
};

export type LeadNote = { id: string; lead_id: string; body: string; created_at: string };

export type LeadEvent = {
  id: string;
  lead_id: string;
  type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export type NewLead = Omit<Lead, "id" | "created_at" | "updated_at" | "last_seen_at">;

export interface LeadStore {
  createLead(input: NewLead): Promise<Lead>;
  findLeadByEmail(email: string): Promise<Lead | null>;
  getLeadByToken(token: string): Promise<Lead | null>;
  getLeadById(id: string): Promise<Lead | null>;
  listLeads(): Promise<Lead[]>;
  updateLead(id: string, patch: Partial<Omit<Lead, "id" | "created_at">>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  addNote(leadId: string, body: string): Promise<LeadNote>;
  listNotes(leadId: string): Promise<LeadNote[]>;
  addEvent(leadId: string, type: string, payload?: Record<string, unknown>): Promise<void>;
  listEvents(leadId: string): Promise<LeadEvent[]>;
}

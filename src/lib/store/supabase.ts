import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead, LeadEvent, LeadNote, LeadStore, NewLead } from "./types";

export class SupabaseLeadStore implements LeadStore {
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    // Clé « service role » : uniquement côté serveur, jamais exposée au navigateur.
    this.db = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  private fail(ctx: string, error: { message: string } | null): never {
    throw new Error(`Supabase ${ctx} : ${error?.message ?? "erreur inconnue"}`);
  }

  async createLead(input: NewLead): Promise<Lead> {
    const { data, error } = await this.db.from("leads").insert(input).select().single();
    if (error || !data) this.fail("createLead", error);
    return data as Lead;
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    const { data, error } = await this.db
      .from("leads")
      .select()
      .ilike("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) this.fail("findLeadByEmail", error);
    return (data as Lead) ?? null;
  }

  async getLeadByToken(token: string): Promise<Lead | null> {
    const { data, error } = await this.db.from("leads").select().eq("token", token).maybeSingle();
    if (error) this.fail("getLeadByToken", error);
    return (data as Lead) ?? null;
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await this.db.from("leads").select().eq("id", id).maybeSingle();
    if (error) this.fail("getLeadById", error);
    return (data as Lead) ?? null;
  }

  async listLeads(): Promise<Lead[]> {
    const { data, error } = await this.db.from("leads").select().order("created_at", { ascending: false });
    if (error) this.fail("listLeads", error);
    return (data as Lead[]) ?? [];
  }

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    const { data, error } = await this.db
      .from("leads")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error || !data) this.fail("updateLead", error);
    return data as Lead;
  }

  async deleteLead(id: string): Promise<void> {
    const { error } = await this.db.from("leads").delete().eq("id", id);
    if (error) this.fail("deleteLead", error);
  }

  async addNote(leadId: string, body: string): Promise<LeadNote> {
    const { data, error } = await this.db.from("lead_notes").insert({ lead_id: leadId, body }).select().single();
    if (error || !data) this.fail("addNote", error);
    return data as LeadNote;
  }

  async listNotes(leadId: string): Promise<LeadNote[]> {
    const { data, error } = await this.db
      .from("lead_notes")
      .select()
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) this.fail("listNotes", error);
    return (data as LeadNote[]) ?? [];
  }

  async addEvent(leadId: string, type: string, payload: Record<string, unknown> = {}): Promise<void> {
    const { error } = await this.db.from("lead_events").insert({ lead_id: leadId, type, payload });
    if (error) this.fail("addEvent", error);
  }

  async listEvents(leadId: string): Promise<LeadEvent[]> {
    const { data, error } = await this.db
      .from("lead_events")
      .select()
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) this.fail("listEvents", error);
    return (data as LeadEvent[]) ?? [];
  }
}

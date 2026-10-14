import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Lead, LeadEvent, LeadNote, LeadStore, NewLead } from "./types";

type Db = { leads: Lead[]; notes: LeadNote[]; events: LeadEvent[] };

/**
 * Stockage local sur fichier JSON, réservé au développement sans Supabase.
 * Jamais utilisé en production (système de fichiers Vercel en lecture seule).
 */
export class FileLeadStore implements LeadStore {
  private file: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(dir = path.join(process.cwd(), ".data")) {
    this.file = path.join(dir, "leads.json");
  }

  private async load(): Promise<Db> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf8")) as Db;
    } catch {
      return { leads: [], notes: [], events: [] };
    }
  }

  private async persist(db: Db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    await fs.writeFile(this.file, JSON.stringify(db, null, 2));
  }

  /** Sérialise les écritures pour éviter les écrasements concurrents. */
  private write<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.load();
      const out = await fn(db);
      await this.persist(db);
      return out;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async createLead(input: NewLead): Promise<Lead> {
    return this.write((db) => {
      const now = new Date().toISOString();
      const lead: Lead = { ...input, id: randomUUID(), created_at: now, updated_at: now, last_seen_at: null };
      db.leads.unshift(lead);
      return lead;
    });
  }

  async findLeadByEmail(email: string): Promise<Lead | null> {
    const db = await this.load();
    return db.leads.find((l) => l.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async getLeadByToken(token: string): Promise<Lead | null> {
    const db = await this.load();
    return db.leads.find((l) => l.token === token) ?? null;
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const db = await this.load();
    return db.leads.find((l) => l.id === id) ?? null;
  }

  async listLeads(): Promise<Lead[]> {
    const db = await this.load();
    return [...db.leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async updateLead(id: string, patch: Partial<Lead>): Promise<Lead> {
    return this.write((db) => {
      const lead = db.leads.find((l) => l.id === id);
      if (!lead) throw new Error("Dossier introuvable");
      Object.assign(lead, patch, { updated_at: new Date().toISOString() });
      return lead;
    });
  }

  async deleteLead(id: string): Promise<void> {
    await this.write((db) => {
      db.leads = db.leads.filter((l) => l.id !== id);
      db.notes = db.notes.filter((n) => n.lead_id !== id);
      db.events = db.events.filter((e) => e.lead_id !== id);
    });
  }

  async addNote(leadId: string, body: string): Promise<LeadNote> {
    return this.write((db) => {
      const note: LeadNote = { id: randomUUID(), lead_id: leadId, body, created_at: new Date().toISOString() };
      db.notes.unshift(note);
      return note;
    });
  }

  async listNotes(leadId: string): Promise<LeadNote[]> {
    const db = await this.load();
    return db.notes.filter((n) => n.lead_id === leadId);
  }

  async addEvent(leadId: string, type: string, payload: Record<string, unknown> = {}): Promise<void> {
    await this.write((db) => {
      db.events.unshift({ id: randomUUID(), lead_id: leadId, type, payload, created_at: new Date().toISOString() });
    });
  }

  async listEvents(leadId: string): Promise<LeadEvent[]> {
    const db = await this.load();
    return db.events.filter((e) => e.lead_id === leadId).slice(0, 100);
  }
}

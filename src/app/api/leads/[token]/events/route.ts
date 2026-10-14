import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

const schema = z.object({
  type: z.enum(["espace_viewed", "booking_viewed", "demo_opened", "report_downloaded", "preview_played"]),
});

/** Journalise une action du prospect dans son espace (ouverture, démo consultée…). */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Événement inconnu." }, { status: 400 });

  try {
    const store = getStore();
    const lead = await store.getLeadByToken(token);
    if (!lead) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    await store.addEvent(lead.id, parsed.data.type);
    if (parsed.data.type === "espace_viewed") await store.updateLead(lead.id, { last_seen_at: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/events]", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

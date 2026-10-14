import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getStore, type Booking } from "@/lib/store";
import { sendBookingRequestReceived, sendBookingRequestToAgency } from "@/lib/email";
import { STAGE_BOOKED } from "@/lib/diagnostic";

export const runtime = "nodejs";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("embed") }),
  z.object({
    kind: z.literal("request"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
    label: z.string().trim().max(80),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Heure invalide."),
    message: z.string().trim().max(600).optional(),
  }),
]);

/** Enregistre un rendez-vous (détecté dans l’agenda intégré, ou demandé via le formulaire interne). */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Demande invalide." }, { status: 400 });

  try {
    const store = getStore();
    const lead = await store.getLeadByToken(token);
    if (!lead) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

    const booking: Booking = { ...parsed.data, at: new Date().toISOString() };
    const updated = await store.updateLead(lead.id, {
      booking,
      stage: lead.stage < STAGE_BOOKED ? STAGE_BOOKED : lead.stage,
    });
    await store.addEvent(lead.id, booking.kind === "embed" ? "booking_scheduled" : "booking_requested", { ...booking });

    if (booking.kind === "request") {
      after(async () => {
        const results = await Promise.allSettled([sendBookingRequestToAgency(updated), sendBookingRequestReceived(updated)]);
        for (const r of results) if (r.status === "rejected") console.error("[email] échec", r.reason);
      });
    }
    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    console.error("[api/booking]", e);
    return NextResponse.json({ error: "Impossible d’enregistrer le rendez-vous pour le moment." }, { status: 500 });
  }
}

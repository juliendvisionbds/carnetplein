import { NextResponse, after } from "next/server";
import { z } from "zod";
import { getStore, type Booking } from "@/lib/store";
import { sendBookingRequestReceived, sendBookingRequestToAgency } from "@/lib/email";
import { STAGE_BOOKED } from "@/lib/diagnostic";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, LOCALES, hasLocale } from "@/i18n/config";

export const runtime = "nodejs";

const makeSchema = (t: ReturnType<typeof getDictionary>["api"]) =>
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("embed"), locale: z.enum(LOCALES).optional() }),
    z.object({
      kind: z.literal("request"),
      locale: z.enum(LOCALES).optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t.invalidDate),
      label: z.string().trim().max(80),
      time: z.string().regex(/^\d{2}:\d{2}$/, t.invalidTime),
      message: z.string().trim().max(600).optional(),
    }),
  ]);

/** Enregistre un rendez-vous (détecté dans l’agenda intégré, ou demandé via le formulaire interne). */
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const body = (await req.json().catch(() => null)) as { locale?: unknown } | null;
  const t = getDictionary(hasLocale(body?.locale) ? body.locale : DEFAULT_LOCALE).api;
  const parsed = makeSchema(t).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? t.invalidRequest }, { status: 400 });

  try {
    const store = getStore();
    const lead = await store.getLeadByToken(token);
    if (!lead) return NextResponse.json({ error: t.notFound }, { status: 404 });

    const { locale: _locale, ...data } = parsed.data;
    const booking: Booking = { ...data, at: new Date().toISOString() };
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
    return NextResponse.json({ error: t.bookingFailed }, { status: 500 });
  }
}

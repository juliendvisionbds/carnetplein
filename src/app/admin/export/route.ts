import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { STAGES, profiles, questions, questionLabel, formatAnswer } from "@/lib/diagnostic";
import { SITE } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Export CSV (séparateur « ; », BOM UTF-8) lisible directement dans Excel ou Numbers. */
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Non autorisé", { status: 401 });
  const leads = await getStore().listLeads();

  const head = ["Date", "Étape", "Entreprise", "Nom", "E-mail", "Téléphone", "Site", "Titre du site", "Métier", "Priorité", "Signal", "Secondaire", "Démo", "Rendez-vous", "Espace", "Source", "Contexte", ...questions.map(questionLabel)];
  const rows = leads.map((l) => [
    l.created_at.slice(0, 10),
    STAGES[l.stage],
    l.company,
    l.name,
    l.email,
    l.phone,
    l.website,
    l.site_title,
    l.trade,
    profiles[l.priority].tag,
    l.intensity,
    l.secondary ? profiles[l.secondary].tag : "",
    l.demo_url,
    l.booking ? (l.booking.kind === "request" ? `${l.booking.label} ${l.booking.time}` : `confirmé ${l.booking.at.slice(0, 10)}`) : "",
    `${SITE.url}/espace/${l.token}`,
    l.utm ? Object.entries(l.utm).map(([k, v]) => `${k}=${v}`).join(" ") : "",
    l.context,
    ...questions.map((q) => formatAnswer(l.answers, q.id)),
  ]);

  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="carnet-plein-dossiers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

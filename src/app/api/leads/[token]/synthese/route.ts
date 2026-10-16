import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getStore } from "@/lib/store";
import { SyntheseDocument } from "@/lib/pdf/synthese";
import { getDictionary } from "@/i18n";
import { leadLocale } from "@/i18n/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** La synthèse du diagnostic en PDF, dans la langue du prospect, à télécharger depuis son espace. */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  // ?inline=1 : affichage dans le navigateur au lieu du téléchargement.
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  const store = getStore();
  const lead = await store.getLeadByToken(token);
  if (!lead) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });

  try {
    const pdf = await renderToBuffer(SyntheseDocument({ lead }));
    store.addEvent(lead.id, "report_downloaded").catch(() => undefined);
    const prefix = getDictionary(leadLocale(lead.locale)).pdf.filePrefix;
    const slug = (lead.company || lead.name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${prefix}-${slug}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[api/synthese]", e);
    return NextResponse.json({ error: "Impossible de générer la synthèse pour le moment." }, { status: 500 });
  }
}

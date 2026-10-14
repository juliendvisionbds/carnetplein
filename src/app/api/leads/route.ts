import { NextResponse, after } from "next/server";
import { createLeadFromSubmission, notifyNewLead, submissionSchema, SubmissionError } from "@/lib/leads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête illisible." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? "Formulaire invalide." }, { status: 400 });
  }

  try {
    const { lead, redo } = await createLeadFromSubmission(parsed.data);
    after(() => notifyNewLead(lead, redo));
    return NextResponse.json({ token: lead.token, redo });
  } catch (e) {
    if (e instanceof SubmissionError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error("[api/leads] échec", e);
    return NextResponse.json(
      { error: "Impossible d’enregistrer votre diagnostic pour le moment. Réessayez dans un instant." },
      { status: 500 },
    );
  }
}

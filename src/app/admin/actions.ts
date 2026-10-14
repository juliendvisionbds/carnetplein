"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPassword, createSession, destroySession, isAdmin } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { STAGES, STAGE_DEMO_SENT, type Stage } from "@/lib/diagnostic";
import { sendDemoReady } from "@/lib/email";

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) redirect("/admin/login?e=1");
  await createSession();
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

function leadPath(id: string) {
  return `/admin/leads/${id}`;
}

export async function setStage(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const stage = Number(formData.get("stage")) as Stage;
  if (!Number.isInteger(stage) || stage < 0 || stage >= STAGES.length) return;
  const store = getStore();
  const lead = await store.getLeadById(id);
  if (!lead) return;
  if (lead.stage !== stage) {
    await store.updateLead(id, { stage });
    await store.addEvent(id, "stage_changed", { from: STAGES[lead.stage], to: STAGES[stage] });
  }
  revalidatePath("/admin");
  revalidatePath(leadPath(id));
}

export async function setTrade(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const trade = String(formData.get("trade") ?? "").trim().slice(0, 120) || null;
  await getStore().updateLead(id, { trade });
  revalidatePath("/admin");
  revalidatePath(leadPath(id));
}

export async function addNote(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const body = String(formData.get("note") ?? "").trim();
  if (!body) return;
  await getStore().addNote(id, body.slice(0, 2000));
  revalidatePath(leadPath(id));
}

export async function setDemoUrl(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const raw = String(formData.get("demo_url") ?? "").trim();
  const notify = formData.get("notify") === "on";
  const store = getStore();
  const lead = await store.getLeadById(id);
  if (!lead) return;

  let demo_url: string | null = null;
  if (raw) {
    try {
      const u = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
      demo_url = u.href;
    } catch {
      redirect(`${leadPath(id)}?err=demo_url`);
    }
  }

  const patch: Record<string, unknown> = { demo_url };
  if (demo_url && lead.stage < STAGE_DEMO_SENT) patch.stage = STAGE_DEMO_SENT;
  const updated = await store.updateLead(id, patch);
  if (demo_url) {
    await store.addEvent(id, "demo_sent", { demo_url, notified: notify });
    if (notify) {
      const ok = await sendDemoReady(updated);
      await store.addEvent(id, ok ? "email_demo_sent" : "email_demo_skipped");
    }
  }
  revalidatePath("/admin");
  revalidatePath(leadPath(id));
}

export async function deleteLead(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await getStore().deleteLead(id);
  revalidatePath("/admin");
  redirect("/admin");
}

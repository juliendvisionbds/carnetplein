"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking as BookingData } from "@/lib/store";
import { toast } from "@/components/Toaster";
import { INTL_TAG, fmt, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = {
  token: string;
  name: string;
  email: string;
  bookingUrl: string;
  initial: BookingData | null;
  lang: Locale;
  t: Dictionary["booking"];
  callTitle: string;
};

const TIMES = ["09:30", "11:00", "14:30", "16:00"];

function nextBusinessDays(lang: Locale, count = 5) {
  const out: { iso: string; label: string }[] = [];
  const d = new Date();
  const fmtDay = new Intl.DateTimeFormat(INTL_TAG[lang], { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push({ iso: d.toISOString().slice(0, 10), label: fmtDay.format(d) });
  }
  return out;
}

function embedUrl(base: string, name: string, email: string): string {
  try {
    const u = new URL(base);
    u.searchParams.set("name", name);
    u.searchParams.set("email", email);
    if (u.hostname.includes("calendly.com")) {
      u.searchParams.set("hide_gdpr_banner", "1");
      u.searchParams.set("hide_event_type_details", "1");
      u.searchParams.set("embed_domain", window.location.hostname);
      u.searchParams.set("embed_type", "Inline");
    }
    if (u.hostname.includes("cal.com")) {
      u.searchParams.set("embed", "vision");
      u.searchParams.set("embedType", "inline");
    }
    return u.toString();
  } catch {
    return base;
  }
}

/** Le contenu de réservation : agenda intégré (Calendly, Cal.com) ou formulaire interne de demande de créneau. */
export function BookingWidget({ token, name, email, bookingUrl, initial, lang, t, callTitle }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const days = useMemo(() => nextBusinessDays(lang), [lang]);
  const [day, setDay] = useState(days[0]?.iso ?? "");
  const [time, setTime] = useState(TIMES[0]);
  const [message, setMessage] = useState("");

  // L’URL d’intégration dépend du nom de domaine : calculée côté navigateur.
  useEffect(() => {
    if (bookingUrl) setSrc(embedUrl(bookingUrl, name, email));
  }, [bookingUrl, name, email]);

  async function save(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${token}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, locale: lang }),
      });
      const data = (await res.json()) as { booking?: BookingData; error?: string };
      if (!res.ok || !data.booking) throw new Error(data.error || t.saveError);
      setBooking(data.booking);
      setEditing(false);
      router.refresh(); // met à jour la timeline rendue côté serveur
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t.genericError);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // Détection d’un rendez-vous confirmé dans l’agenda intégré (Calendly ou Cal.com).
  useEffect(() => {
    if (!bookingUrl) return;
    const onMessage = (e: MessageEvent) => {
      const d = e.data as { event?: string; originator?: string; type?: string } | undefined;
      if (!d || typeof d !== "object") return;
      const calendly = d.event === "calendly.event_scheduled";
      const cal = d.originator === "CAL" && typeof d.type === "string" && d.type.startsWith("bookingSuccessful");
      if (calendly || cal) {
        void save({ kind: "embed" }).then((ok) => ok && toast(t.confirmedToast));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [bookingUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    const label = days.find((d) => d.iso === day)?.label ?? day;
    const ok = await save({ kind: "request", date: day, label, time, message: message || undefined });
    if (ok) toast(t.requestToast);
  }

  if (booking && !editing) {
    return (
      <div className="booking-done">
        <div className="success">
          <b>{booking.kind === "embed" ? t.doneConfirmed : t.doneRequested}</b>
          {booking.kind === "request" ? (
            <>
              {fmt(t.doneRequestText, { label: booking.label ?? booking.date ?? "", time: booking.time ?? "" })}
              <div>
                <button type="button" className="text-btn" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
                  {t.anotherSlot}
                </button>
              </div>
            </>
          ) : (
            <>{t.doneEmbedText}</>
          )}
        </div>
      </div>
    );
  }

  if (bookingUrl) {
    return (
      <div className="booking-embed">
        {src && <iframe title={t.iframeTitle} src={src} allow="payment" />}
        <div className="micro" style={{ textAlign: "center" }}>
          {t.trouble}{" "}
          <a href={bookingUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
            {t.openNewWindow}
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submitRequest} className="booking-form">
      <h3>{t.formTitle}</h3>
      <p style={{ fontSize: 13 }}>{t.formIntro}</p>
      <label className="field">
        {t.day}
        <select value={day} onChange={(e) => setDay(e.target.value)} required>
          {days.map((d) => (
            <option key={d.iso} value={d.iso}>
              {d.label}
            </option>
          ))}
        </select>
      </label>
      <div className="field" style={{ marginTop: 12 }}>
        {t.parisTime}
        <div className="slots" role="radiogroup" aria-label={t.timeAria}>
          {TIMES.map((x) => (
            <button key={x} type="button" role="radio" aria-checked={time === x} className={time === x ? "selected" : ""} onClick={() => setTime(x)}>
              {x}
            </button>
          ))}
        </div>
      </div>
      <label className="field" style={{ marginTop: 12 }}>
        {t.note}
        <textarea rows={2} maxLength={600} value={message} onChange={(e) => setMessage(e.target.value)} />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn lime block" style={{ marginTop: 20 }} type="submit" disabled={saving}>
        {saving ? t.sending : booking ? t.proposeSlot : `${callTitle} ↗`}
      </button>
      {booking && (
        <button type="button" className="text-btn" style={{ marginTop: 12 }} onClick={() => setEditing(false)}>
          {t.cancel}
        </button>
      )}
    </form>
  );
}

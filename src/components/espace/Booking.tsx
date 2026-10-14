"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Booking as BookingData } from "@/lib/store";
import { CALL } from "@/lib/content";
import { toast } from "@/components/Toaster";
import { track } from "./track";

type Props = { token: string; name: string; email: string; bookingUrl: string; initial: BookingData | null };

const TIMES = ["09:30", "11:00", "14:30", "16:00"];

function nextBusinessDays(count = 5) {
  const out: { iso: string; label: string }[] = [];
  const d = new Date();
  const fmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push({ iso: d.toISOString().slice(0, 10), label: fmt.format(d) });
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
      u.searchParams.set("embed_domain", window.location.hostname);
      u.searchParams.set("embed_type", "Inline");
    }
    if (u.hostname.includes("cal.com")) {
      u.searchParams.set("embed", "carnet-plein");
      u.searchParams.set("embedType", "inline");
    }
    return u.toString();
  } catch {
    return base;
  }
}

export function Booking({ token, name, email, bookingUrl, initial }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingData | null>(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const days = useMemo(() => nextBusinessDays(), []);
  const [day, setDay] = useState(days[0]?.iso ?? "");
  const [time, setTime] = useState(TIMES[0]);
  const [message, setMessage] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  // L’URL d’intégration dépend du nom de domaine : calculée côté navigateur.
  useEffect(() => {
    if (bookingUrl) setSrc(embedUrl(bookingUrl, name, email));
  }, [bookingUrl, name, email]);

  // Journalise la première fois que la section rendez-vous devient visible.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          track(token, "booking_viewed");
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [token]);

  async function save(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${token}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { booking?: BookingData; error?: string };
      if (!res.ok || !data.booking) throw new Error(data.error || "Impossible d’enregistrer le rendez-vous.");
      setBooking(data.booking);
      setEditing(false);
      router.refresh(); // met à jour la timeline rendue côté serveur
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
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
        void save({ kind: "embed" }).then((ok) => ok && toast("Rendez-vous confirmé. À très vite !"));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [bookingUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    const label = days.find((d) => d.iso === day)?.label ?? day;
    const ok = await save({ kind: "request", date: day, label, time, message: message || undefined });
    if (ok) toast("Demande envoyée. Nous confirmons le créneau par e-mail.");
  }

  const confirmed = booking && !editing;

  return (
    <div className="panel" id="rdv" ref={sectionRef}>
      <div className="eyebrow">On regarde ça ensemble ?</div>
      <h3 style={{ marginTop: 18 }}>
        {CALL.duration}.
        <br />
        Votre projet à l’écran.
      </h3>

      {confirmed ? (
        <div className="success" style={{ marginTop: 16 }}>
          <b>{booking.kind === "embed" ? "Rendez-vous confirmé." : "Demande de créneau envoyée."}</b>
          {booking.kind === "request" ? (
            <>
              {booking.label} à {booking.time} (heure de Paris). Nous confirmons par e-mail.
              <div>
                <button type="button" className="text-btn" style={{ marginTop: 10 }} onClick={() => setEditing(true)}>
                  Proposer un autre créneau
                </button>
              </div>
            </>
          ) : (
            <>Vous recevez l’invitation dans votre agenda. À très vite.</>
          )}
        </div>
      ) : bookingUrl ? (
        <>
          <p style={{ fontSize: 13 }}>Choisissez le créneau qui vous convient. L’invitation arrive directement dans votre agenda.</p>
          <div className="booking-embed">{src && <iframe title="Réserver un créneau" src={src} loading="lazy" allow="payment" />}</div>
          <div className="micro">
            Un souci avec l’agenda ?{" "}
            <a href={bookingUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              Ouvrir dans une nouvelle fenêtre
            </a>
          </div>
        </>
      ) : (
        <form onSubmit={submitRequest}>
          <p style={{ fontSize: 13 }}>Indiquez le créneau qui vous arrange. Nous vous le confirmons par e-mail.</p>
          <label className="field">
            Jour
            <select value={day} onChange={(e) => setDay(e.target.value)} required>
              {days.map((d) => (
                <option key={d.iso} value={d.iso}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <div className="field" style={{ marginTop: 12 }}>
            Heure de Paris
            <div className="slots" role="radiogroup" aria-label="Heure">
              {TIMES.map((t) => (
                <button key={t} type="button" role="radio" aria-checked={time === t} className={time === t ? "selected" : ""} onClick={() => setTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            Un mot pour préparer l’échange (facultatif)
            <textarea rows={2} maxLength={600} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="btn lime block" style={{ marginTop: 20 }} type="submit" disabled={saving}>
            {saving ? "Envoi…" : booking ? "Proposer ce créneau ↗" : `${CALL.title} ↗`}
          </button>
          {booking && (
            <button type="button" className="text-btn" style={{ marginTop: 12 }} onClick={() => setEditing(false)}>
              Annuler
            </button>
          )}
        </form>
      )}
    </div>
  );
}

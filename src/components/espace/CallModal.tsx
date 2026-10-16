"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Booking as BookingData } from "@/lib/store";
import { BookingWidget } from "./Booking";
import { track } from "./track";
import { fmt, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = {
  token: string;
  name: string;
  email: string;
  bookingUrl: string;
  initial: BookingData | null;
  lang: Locale;
  t: Dictionary["callModal"];
  tb: Dictionary["booking"];
  call: Dictionary["call"];
  demoDelayShort: string;
};

/**
 * Le popup de réservation. Il s’ouvre dès que l’URL porte #rdv : tous les boutons
 * « Réserver mon appel » du site pointent sur cette ancre, aucun câblage supplémentaire.
 */
export function CallModal({ token, name, email, bookingUrl, initial, lang, t, tb, call, demoDelayShort }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    ref.current?.close();
    setOpen(false);
    if (window.location.hash === "#rdv") history.replaceState(null, "", window.location.pathname + window.location.search);
  }, []);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#rdv" && ref.current && !ref.current.open) {
        ref.current.showModal();
        setOpen(true);
        track(token, "booking_viewed");
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [token]);

  return (
    <dialog
      ref={ref}
      className="call-modal"
      aria-labelledby="call-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button type="button" className="call-close" onClick={close} aria-label={t.close}>
        ×
      </button>
      <div className="call-grid">
        <aside className="call-left">
          <span className="eyebrow">{fmt(t.eyebrow, { duration: call.duration })}</span>
          <h2 id="call-title">{t.title}</h2>
          <p className="call-intro">{t.intro}</p>
          <ol className="call-steps">
            {t.steps.map(([lead, rest]) => (
              <li key={lead}>
                <b>{lead}</b>
                {rest}
              </li>
            ))}
          </ol>
          <div className="call-stats">
            <div>
              <strong>{demoDelayShort}</strong>
              <span>{t.statDemo}</span>
            </div>
            <div>
              <strong>{t.statSetupValue}</strong>
              <span>{t.statSetup}</span>
            </div>
          </div>
          <div className="call-foot">
            <div className="avatars" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/team/julien.jpg" alt="" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/team/clement.jpg" alt="" />
            </div>
            <span>
              {t.footA}
              <br />
              {t.footB}
            </span>
          </div>
        </aside>
        <div className="call-right">
          {open && <BookingWidget token={token} name={name} email={email} bookingUrl={bookingUrl} initial={initial} lang={lang} t={tb} callTitle={call.title} />}
        </div>
      </div>
    </dialog>
  );
}

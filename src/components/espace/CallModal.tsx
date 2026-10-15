"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Booking as BookingData } from "@/lib/store";
import { CALL, DEMO_DELAY } from "@/lib/content";
import { BookingWidget } from "./Booking";
import { track } from "./track";

type Props = { token: string; name: string; email: string; bookingUrl: string; initial: BookingData | null };

/**
 * Le popup de réservation. Il s’ouvre dès que l’URL porte #rdv : tous les boutons
 * « Réserver mon appel » du site pointent sur cette ancre, aucun câblage supplémentaire.
 */
export function CallModal({ token, name, email, bookingUrl, initial }: Props) {
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
      <button type="button" className="call-close" onClick={close} aria-label="Fermer">
        ×
      </button>
      <div className="call-grid">
        <aside className="call-left">
          <span className="eyebrow">Appel de {CALL.duration} · Gratuit</span>
          <h2 id="call-title">Votre tunnel de vente est construit. On vous le montre.</h2>
          <p className="call-intro">Le parcours que vous venez de vivre ici, refait pour votre business et vos clients.</p>
          <ol className="call-steps">
            <li>
              <b>On déroule votre démo</b>, comme un de vos clients la vivrait : la prise de contact pour votre métier, la réponse immédiate, l’espace
              de suivi, à vos couleurs.
            </li>
            <li>
              <b>On la confronte à votre diagnostic</b> : votre priorité, vos trois actions, et ce que ça change concrètement chez vous.
            </li>
            <li>
              <b>Vous décidez après l’avoir vue.</b> Sans engagement, et vous gardez votre diagnostic et votre plan d’action dans tous les cas.
            </li>
          </ol>
          <div className="call-stats">
            <div>
              <strong>{DEMO_DELAY.replace(/^sous /, "")}</strong>
              <span>pour recevoir votre démo par e-mail, avant ou après l’appel</span>
            </div>
            <div>
              <strong>2 semaines</strong>
              <span>pour l’installer chez vous, sans refaire votre site</span>
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
              Gratuit · sans engagement
              <br />
              En visio ou par téléphone
            </span>
          </div>
        </aside>
        <div className="call-right">
          {open && <BookingWidget token={token} name={name} email={email} bookingUrl={bookingUrl} initial={initial} />}
        </div>
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { TocItem } from "@/lib/blog";

/** Distance au haut de l’écran sous laquelle un titre de section devient la section en cours. */
const ACTIVE_OFFSET = 140;

/** Sommaire « Sur cette page » de la colonne de gauche : la section en cours de lecture est mise en avant. */
export function PostToc({ items, title }: { items: TocItem[]; title: string }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: string | null = null;
      for (const el of headings) if (el.getBoundingClientRect().top < ACTIVE_OFFSET) current = el.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  return (
    <nav className="post-toc" aria-label={title}>
      <p className="post-toc-title">{title}</p>
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={active === item.id ? "active" : undefined} aria-current={active === item.id ? "location" : undefined}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Texte d’un message à copier : paragraphes séparés par une ligne vide, listes gardées avec leurs tirets
 * (ou numéros) et collées à la phrase qui les annonce, comme dans un e-mail écrit à la main.
 */
function messageText(root: HTMLElement): string {
  let text = "";
  for (const block of Array.from(root.children) as HTMLElement[]) {
    if (block.tagName === "UL" || block.tagName === "OL") {
      const items = Array.from(block.children).map((li, i) => `${block.tagName === "OL" ? `${i + 1}.` : "-"} ${(li as HTMLElement).innerText.trim()}`);
      text += (text ? "\n" : "") + items.join("\n");
    } else {
      text += (text ? "\n\n" : "") + block.innerText.trim();
    }
  }
  return text.trim();
}

/** Modèle de message (citation annoncée par « **SMS** », « **E-mail** »…) avec un bouton pour copier son texte. */
export function TemplateQuote({ children, copy, copied }: { children: React.ReactNode; copy: string; copied: string }) {
  const body = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 2200);
    return () => clearTimeout(timer);
  }, [done]);

  async function onCopy() {
    const el = body.current;
    const text = el ? messageText(el) : "";
    if (!el || !text) return;
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      // Presse-papiers refusé (navigateur intégré d’une appli, contexte non sécurisé) : on sélectionne le texte
      // et on tente l’ancienne commande de copie ; en cas d’échec, la sélection reste pour un copier manuel.
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      if (document.execCommand("copy")) {
        selection?.removeAllRanges();
        setDone(true);
      }
    }
  }

  return (
    <blockquote className="template">
      <div ref={body}>{children}</div>
      <button type="button" className="template-copy" onClick={onCopy} aria-live="polite">
        {done ? copied : copy}
      </button>
    </blockquote>
  );
}

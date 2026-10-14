"use client";

import { track } from "./track";

export function DemoLink({ token, href, className = "btn small", label = "Découvrir ma démo ↗" }: { token: string; href: string; className?: string; label?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer" onClick={() => track(token, "demo_opened", false)}>
      {label}
    </a>
  );
}

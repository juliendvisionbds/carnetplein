"use client";

import { track } from "./track";

export function DemoLink({ token, href, label, className = "btn small" }: { token: string; href: string; label: string; className?: string }) {
  return (
    <a className={className} href={href} target="_blank" rel="noreferrer" onClick={() => track(token, "demo_opened", false)}>
      {label}
    </a>
  );
}

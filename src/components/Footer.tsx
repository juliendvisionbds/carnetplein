import Link from "next/link";
import { SITE } from "@/lib/content";

export function Footer() {
  return (
    <footer className="site">
      <Link className="logo" href="/">
        carnet plein<span className="dot">.</span>
      </Link>
      <span>{SITE.tagline}</span>
      <span>
        © {new Date().getFullYear()} {SITE.name} · <Link className="small" href="/confidentialite">Confidentialité</Link>
      </span>
    </footer>
  );
}

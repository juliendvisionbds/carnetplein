"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LEAD_TOKEN_KEY } from "@/lib/client-storage";
import { LogoMark } from "@/components/LogoMark";

export function Header() {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(LEAD_TOKEN_KEY));
    } catch {
      setToken(null);
    }
  }, [pathname]);

  const isAdmin = pathname.startsWith("/admin");
  const inEspace = pathname.startsWith("/espace");
  const inQuiz = pathname.startsWith("/diagnostic");

  return (
    <header className="site">
      <Link className="logo" href="/">
        <LogoMark /> carnet plein<span className="dot">.</span>
      </Link>
      <nav className="site" aria-label="Navigation principale">
        {isAdmin ? (
          <>
            <Link href="/admin">Pilotage</Link>
            <Link href="/">Site public ↗</Link>
          </>
        ) : inQuiz ? (
          <span className="nav-note">
            <i aria-hidden="true">✓</i>
            Gratuit · <span className="hide-sm">3 minutes · Réponses confidentielles</span>
            <span className="only-sm">confidentiel</span>
          </span>
        ) : (
          <>
            <Link href="/#methode">La méthode</Link>
            {token && !inEspace && <Link href={`/espace/${token}`}>Mon espace</Link>}
            {inEspace ? (
              <a className="btn small lime" href="#rdv">
                Réserver mon appel <span>↗</span>
              </a>
            ) : (
              <Link className="btn small" href="/diagnostic">
                Faire le diagnostic <span>↗</span>
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
}

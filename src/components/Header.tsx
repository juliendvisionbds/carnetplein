"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LEAD_TOKEN_KEY } from "@/lib/client-storage";

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

  return (
    <header className="site">
      <Link className="logo" href="/">
        <span className="mark">▤</span> carnet plein<span className="dot">.</span>
      </Link>
      <nav className="site" aria-label="Navigation principale">
        {isAdmin ? (
          <>
            <Link href="/admin">Pilotage</Link>
            <Link href="/">Site public ↗</Link>
          </>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LEAD_TOKEN_KEY } from "@/lib/client-storage";
import { LogoMark } from "@/components/LogoMark";
import { localePath, stripLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = { lang: Locale; t: Dictionary["nav"]; variant?: "public" | "admin" };

export function Header({ lang, t, variant = "public" }: Props) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      setToken(localStorage.getItem(LEAD_TOKEN_KEY));
    } catch {
      setToken(null);
    }
  }, [pathname]);

  const { path } = stripLocale(pathname);
  const home = localePath(lang, "/");
  const isAdmin = variant === "admin";
  const inEspace = path.startsWith("/espace");
  const inQuiz = path.startsWith("/diagnostic");
  const espaceToken = inEspace ? path.split("/")[2] : null;

  return (
    <header className="site">
      <Link className="logo" href={isAdmin ? "/admin" : home}>
        <LogoMark /> vision<span className="dot">.</span>
      </Link>
      <nav className="site" aria-label={t.mainNav}>
        {isAdmin ? (
          <>
            <Link href="/admin">{t.adminDashboard}</Link>
            <Link href="/">{t.adminPublicSite}</Link>
          </>
        ) : inQuiz ? (
          <>
            <span className="nav-note">
              <i aria-hidden="true">✓</i>
              {t.quizNote}
              <span className="hide-sm">{t.quizNoteLong}</span>
              <span className="only-sm">{t.quizNoteShort}</span>
            </span>
          </>
        ) : (
          <>
            {!inEspace && <Link href={`${home}#methode`}>{t.method}</Link>}
            {token && !inEspace && <Link href={localePath(lang, `/espace/${token}`)}>{t.mySpace}</Link>}
            {inEspace ? (
              <>
                {espaceToken && (
                  <a className="btn small outline" href={`/api/leads/${espaceToken}/synthese`} download>
                    <span className="hide-sm">{t.summaryPdf}</span>
                    <span className="only-sm">{t.pdf}</span> ↓
                  </a>
                )}
                <a className="btn small lime" href="#rdv">
                  {t.bookCall} <span>↗</span>
                </a>
              </>
            ) : (
              <Link className="btn small" href={localePath(lang, "/diagnostic")}>
                {t.startDiagnostic} <span>↗</span>
              </Link>
            )}
          </>
        )}
      </nav>
    </header>
  );
}

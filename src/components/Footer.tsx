import Link from "next/link";
import { SITE } from "@/lib/content";
import { LangSwitch } from "@/components/LangSwitch";
import { LOCALE_NAME, localePath, otherLocale, pagePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = { lang: Locale; t: Dictionary["footer"]; tagline: string; switchLabel: string };

export function Footer({ lang, t, tagline, switchLabel }: Props) {
  const other = otherLocale(lang);
  return (
    <footer className="site">
      <Link className="logo" href={localePath(lang, "/")}>
        vision<span className="dot">.</span>
      </Link>
      <span>{tagline}</span>
      <span>
        © {new Date().getFullYear()} {SITE.name} ·{" "}
        <Link className="small" href={pagePath(lang, "trades")}>
          {t.trades}
        </Link>{" "}
        ·{" "}
        <Link className="small" href={pagePath(lang, "legal")}>
          {t.legal}
        </Link>{" "}
        ·{" "}
        <Link className="small" href={pagePath(lang, "privacy")}>
          {t.privacy}
        </Link>{" "}
        · <span className="footer-lang">{LOCALE_NAME[lang]}</span> · <LangSwitch lang={lang} label={switchLabel} text={LOCALE_NAME[other]} className="small" />
      </span>
    </footer>
  );
}

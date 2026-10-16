"use client";

import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, otherLocale, switchLocalePath, type Locale } from "@/i18n/config";

/** Mémorise un choix de langue explicite ; le proxy le respecte ensuite à chaque visite. */
export function rememberLocale(lang: Locale) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}

type Props = { lang: Locale; label: string; text: string; className?: string };

/**
 * Lien vers la même page dans l’autre langue. Un lien classique (pas <Link>) : la navigation
 * recharge la page, ce qui met à jour l’attribut lang du document et évite tout préchargement
 * que le proxy redirigerait.
 */
export function LangSwitch({ lang, label, text, className = "lang-switch" }: Props) {
  const pathname = usePathname();
  const target = otherLocale(lang);
  return (
    <a className={className} href={switchLocalePath(pathname, target)} hrefLang={target} lang={target} aria-label={label} title={label} onClick={() => rememberLocale(target)}>
      {text}
    </a>
  );
}

import Link from "next/link";
import { COMPANY, SITE } from "@/lib/content";
import { Flag } from "@/components/Flag";
import { LangSwitch } from "@/components/LangSwitch";
import { LOCALES, LOCALE_NAME, TRADE_KEYS, fmt, localePath, pagePath, toolPath, tradePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = { lang: Locale; dict: Dictionary; variant?: "public" | "admin" };

/**
 * Pied de page : la marque et l’appel au diagnostic, trois colonnes de liens (métiers, commencer, Vision),
 * puis une ligne avec le copyright, le lien vers VisionBTP et les drapeaux des langues (le seul sélecteur de langue du site).
 * Le back-office n’affiche que la dernière ligne.
 */
export function Footer({ lang, dict, variant = "public" }: Props) {
  const t = dict.footer;
  const home = localePath(lang, "/");
  const diagnostic = localePath(lang, "/diagnostic");
  const columns = [
    {
      id: "footer-trades",
      title: t.trades,
      links: [
        ...TRADE_KEYS.map((trade) => ({ href: tradePath(lang, trade), label: dict.trades.pages[trade].name })),
        { href: pagePath(lang, "trades"), label: t.allTrades },
      ],
    },
    {
      id: "footer-start",
      title: t.start,
      links: [
        { href: diagnostic, label: t.diagnostic },
        { href: `${home}#methode`, label: t.method },
        { href: `${home}#faq`, label: t.faq },
        { href: toolPath(lang, "quoteFollowUp"), label: t.followUp },
        { href: toolPath(lang), label: t.tools },
        { href: localePath(lang, "/blog"), label: dict.blog.crumb },
      ],
    },
    {
      id: "footer-company",
      title: t.company,
      links: [
        { href: pagePath(lang, "about"), label: t.about },
        { href: pagePath(lang, "team"), label: t.team },
        { href: pagePath(lang, "legal"), label: t.legal },
        { href: pagePath(lang, "privacy"), label: t.privacy },
      ],
    },
  ];

  return (
    <footer className="site">
      {variant === "public" && (
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="logo" href={home}>
              vision<span className="dot">.</span>
            </Link>
            <p>{dict.meta.tagline}</p>
            <Link className="footer-cta" href={diagnostic}>
              {t.cta}
            </Link>
          </div>
          <nav className="footer-cols" aria-label={t.aria}>
            {columns.map((col) => (
              <div key={col.id}>
                <p className="footer-title" id={col.id}>
                  {col.title}
                </p>
                <ul aria-labelledby={col.id}>
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      )}
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {SITE.name}
        </span>
        {/* Sans noreferrer : VisionBTP voit d’où viennent ses visiteurs. */}
        <a href={COMPANY.builtBy.url} target="_blank" rel="noopener">
          {fmt(t.builtBy, { studio: COMPANY.builtBy.name })} ↗
        </a>
        <span className="footer-langs">
          {LOCALES.map((l) =>
            l === lang ? (
              <span key={l} className="flag current" lang={l} title={LOCALE_NAME[l]}>
                <Flag lang={l} />
                <span className="sr-only">{LOCALE_NAME[l]}</span>
              </span>
            ) : (
              <LangSwitch key={l} lang={lang} label={dict.nav.switchLabel} className="flag">
                <Flag lang={l} />
              </LangSwitch>
            ),
          )}
        </span>
      </div>
    </footer>
  );
}

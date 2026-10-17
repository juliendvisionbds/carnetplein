import Link from "next/link";
import { COMPANY, SITE } from "@/lib/content";
import { LangSwitch } from "@/components/LangSwitch";
import { LOCALE_NAME, TRADE_KEYS, fmt, localePath, otherLocale, pagePath, tradePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";

type Props = { lang: Locale; dict: Dictionary; variant?: "public" | "admin" };

/**
 * Pied de page : la marque et l’appel au diagnostic, trois colonnes de liens (métiers, commencer, Vision),
 * puis une ligne avec le copyright, le lien vers VisionBTP et le changement de langue.
 * Le back-office n’affiche que la dernière ligne.
 */
export function Footer({ lang, dict, variant = "public" }: Props) {
  const t = dict.footer;
  const other = otherLocale(lang);
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
        <span>
          <span className="footer-lang">{LOCALE_NAME[lang]}</span> · <LangSwitch lang={lang} label={dict.nav.switchLabel} text={LOCALE_NAME[other]} className="small" />
        </span>
      </div>
    </footer>
  );
}

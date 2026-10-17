import { DM_Sans, Manrope } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { UtmCapture } from "@/components/UtmCapture";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = { lang: Locale; variant?: "public" | "admin"; children: React.ReactNode };

// Polices variables auto-hébergées par next/font (pas de requête vers Google Fonts au chargement),
// exposées en variables CSS utilisées par globals.css.
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

/** Squelette HTML commun aux deux layouts racines (site public par langue, back-office). */
export function Shell({ lang, variant = "public", children }: Props) {
  const t = getDictionary(lang);
  return (
    <html lang={lang} className={`${dmSans.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <body>
        <Header lang={lang} t={t.nav} variant={variant} />
        <main id="app">{children}</main>
        <Footer lang={lang} dict={t} variant={variant} />
        <Toaster />
        <UtmCapture />
      </body>
    </html>
  );
}

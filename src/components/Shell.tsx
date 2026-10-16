import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/Toaster";
import { UtmCapture } from "@/components/UtmCapture";
import { getDictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";

type Props = { lang: Locale; variant?: "public" | "admin"; children: React.ReactNode };

/** Squelette HTML commun aux deux layouts racines (site public par langue, back-office). */
export function Shell({ lang, variant = "public", children }: Props) {
  const t = getDictionary(lang);
  return (
    <html lang={lang} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;450;500;550;600;650;700&family=Manrope:wght@400;500;600;650;700;750;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header lang={lang} t={t.nav} variant={variant} />
        <main id="app">{children}</main>
        <Footer lang={lang} t={t.footer} tagline={t.meta.tagline} switchLabel={t.nav.switchLabel} />
        <Toaster />
        <UtmCapture />
      </body>
    </html>
  );
}

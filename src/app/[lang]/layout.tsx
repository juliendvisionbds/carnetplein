import type { Metadata } from "next";
import "@/app/globals.css";
import { Shell } from "@/components/Shell";
import { DEFAULT_LOCALE, LOCALES, hasLocale } from "@/i18n/config";
import { rootMetadata } from "@/i18n/metadata";

type Params = Promise<{ lang: string }>;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  return rootMetadata(hasLocale(lang) ? lang : DEFAULT_LOCALE);
}

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { lang } = await params;
  // Une langue inconnue (ex. /xyz) aboutit à la page 404, affichée dans l’habillage anglais.
  return <Shell lang={hasLocale(lang) ? lang : DEFAULT_LOCALE}>{children}</Shell>;
}

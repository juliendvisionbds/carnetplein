import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, hasLocale } from "@/i18n/config";
import { SITE } from "@/lib/content";

/**
 * Image de partage (Open Graph et X/Twitter) de chaque langue, générée au build.
 * Reprend le hero de l’accueil : badge, titre, symbole et domaine.
 */

const size = { width: 1200, height: 630 };
const contentType = "image/png";

export function generateImageMetadata({ params }: { params: { lang: string } }) {
  const t = getDictionary(params.lang);
  return [{ id: "default", alt: t.meta.title, size, contentType }];
}

const fonts = Promise.all(
  (["Manrope-800", "DMSans-600"] as const).map((file) => readFile(join(process.cwd(), "src/assets/fonts", `${file}.ttf`))),
);

const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="2" y="2" width="36" height="36" rx="11" fill="#d9f879" stroke="#b7d354" stroke-width="1.2"/><path d="M8 20C13 11.5 27 11.5 32 20C27 28.5 13 28.5 8 20Z" fill="#fffefa" stroke="#272727" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="20" r="4.8" fill="#272727"/><circle cx="21.7" cy="18.3" r="1.4" fill="#d9f879"/></svg>`;

export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(lang);
  const [manrope, dmSans] = await fonts;
  const host = new URL(SITE.url).host.replace(/^www\./, "");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f8f7f2", color: "#272727", padding: "64px 72px", fontFamily: "DM Sans" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Manrope", fontSize: 44, letterSpacing: -2 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/svg+xml;base64,${Buffer.from(MARK).toString("base64")}`} width={64} height={64} alt="" />
            <span>
              vision<span style={{ color: "#8a83c6" }}>.</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#272727", color: "#d9f879", borderRadius: 40, padding: "12px 24px", fontSize: 20, letterSpacing: 2, textTransform: "uppercase" }}>
            <div style={{ width: 10, height: 10, borderRadius: 10, background: "#d9f879" }} />
            {t.home.eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Manrope", fontSize: 92, lineHeight: 1.05, letterSpacing: -4 }}>
          <span>{t.home.h1a}</span>
          <span>{t.home.h1b}</span>
          <span style={{ color: "#7971af" }}>{t.home.h1c}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 26, color: "#76766e" }}>
          <span>{t.meta.tagline}</span>
          <span style={{ background: "#d9f879", color: "#272727", borderRadius: 12, padding: "10px 20px" }}>{host}</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Manrope", data: manrope, weight: 800, style: "normal" },
        { name: "DM Sans", data: dmSans, weight: 600, style: "normal" },
      ],
    },
  );
}

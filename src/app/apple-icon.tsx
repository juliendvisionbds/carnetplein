import { ImageResponse } from "next/og";

/** Icône d’écran d’accueil iOS (et logo raster des données structurées) : l’œil sur fond vert citron, carré plein. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const EYE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="6 6 28 28"><path d="M8 20C13 11.5 27 11.5 32 20C27 28.5 13 28.5 8 20Z" fill="#fffefa" stroke="#272727" stroke-width="2.4" stroke-linejoin="round"/><circle cx="20" cy="20" r="4.8" fill="#272727"/><circle cx="21.7" cy="18.3" r="1.4" fill="#d9f879"/></svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#d9f879" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml;base64,${Buffer.from(EYE).toString("base64")}`} width={132} height={132} alt="" />
      </div>
    ),
    size,
  );
}

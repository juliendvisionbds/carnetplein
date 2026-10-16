import type { NextConfig } from "next";

/** Domaine canonique (NEXT_PUBLIC_SITE_URL), lu au build comme SITE.url dans src/lib/content.ts. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";
const SITE_HOST = SITE_URL ? new URL(SITE_URL).host : "";

/**
 * En production, les adresses *.vercel.app (carnetplein.vercel.app, URL de déploiement) renvoient
 * vers le domaine canonique : sans cela, Google voit deux sites identiques.
 * Garde-fou : rien n’est ajouté tant que le domaine canonique est lui-même en .vercel.app.
 */
const canonicalHostRedirects =
  process.env.VERCEL_ENV === "production" && SITE_HOST && !SITE_HOST.endsWith(".vercel.app")
    ? [{ source: "/:path*", has: [{ type: "host" as const, value: ".*\\.vercel\\.app" }], destination: `${SITE_URL}/:path*`, permanent: true }]
    : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Génération PDF côté serveur : la bibliothèque reste en dépendance externe et les polices sont embarquées dans la fonction.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/leads/[token]/synthese": ["./src/assets/fonts/*.ttf"],
    "/[lang]/opengraph-image": ["./src/assets/fonts/*.ttf"],
  },
  async redirects() {
    return canonicalHostRedirects;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;

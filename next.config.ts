import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Génération PDF côté serveur : la bibliothèque reste en dépendance externe et les polices sont embarquées dans la fonction.
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: { "/api/leads/[token]/synthese": ["./src/assets/fonts/*.ttf"] },
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

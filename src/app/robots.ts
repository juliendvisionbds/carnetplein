import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/diagnostic", "/confidentialite"], disallow: ["/espace/", "/admin", "/api/"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}

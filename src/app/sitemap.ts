import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE.url}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/diagnostic`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

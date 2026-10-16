import type { Metadata } from "next";
import "@/app/globals.css";
import { Shell } from "@/components/Shell";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: { default: `Pilotage · ${SITE.name}`, template: `%s · ${SITE.name}` },
  robots: { index: false, follow: false },
};

/** Layout racine du back-office : toujours en français, hors du routage par langue. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell lang="fr" variant="admin">
      {children}
    </Shell>
  );
}

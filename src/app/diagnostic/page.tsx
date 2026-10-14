import type { Metadata } from "next";
import { Quiz } from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Votre diagnostic gratuit",
  description: "Neuf questions, trois minutes : découvrez où vos demandes de devis se perdent et quoi faire en premier.",
};

export default function DiagnosticPage() {
  return <Quiz />;
}

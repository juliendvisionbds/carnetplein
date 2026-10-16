import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Quiz } from "@/components/Quiz";
import { getDictionary } from "@/i18n";
import { hasLocale } from "@/i18n/config";
import { pageMetadata } from "@/i18n/metadata";

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).diagnosticPage;
  return pageMetadata(lang, { path: "/diagnostic" }, { title: t.title, description: t.description });
}

export default async function DiagnosticPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  // Le questionnaire s’affiche après lecture des réponses enregistrées dans le navigateur :
  // ce titre garantit un h1 dès le HTML serveur (moteurs de recherche, lecteurs d’écran).
  return (
    <>
      <h1 className="sr-only">{t.diagnosticPage.title}</h1>
      <Quiz lang={lang} t={t.quiz} d={t.diagnostic} />
    </>
  );
}

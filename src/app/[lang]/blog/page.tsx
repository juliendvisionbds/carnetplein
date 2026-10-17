import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogIndex } from "@/components/BlogPages";
import { getDictionary } from "@/i18n";
import { hasLocale } from "@/i18n/config";
import { pageMetadata } from "@/i18n/metadata";
import { getPosts } from "@/lib/blog";

/** Page du blog : /blog ↔ /fr/blog. */

type Params = Promise<{ lang: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang).blog;
  return pageMetadata(lang, { path: "/blog" }, { title: t.title, description: t.description });
}

export default async function BlogPage({ params }: { params: Params }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <BlogIndex lang={lang} dict={getDictionary(lang)} posts={getPosts(lang)} />;
}

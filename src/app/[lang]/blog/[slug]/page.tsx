import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/components/BlogPages";
import { getDictionary } from "@/i18n";
import { BLOG_KEYS, BLOG_SLUGS, LOCALES, blogPostFromSlug, hasLocale } from "@/i18n/config";
import { blogPostMetadata } from "@/i18n/metadata";
import { getPost, getPostMeta, getPosts } from "@/lib/blog";

/** Article du blog : /blog/<slug anglais> ↔ /fr/blog/<slug français> (BLOG_SLUGS). Seuls les articles déclarés existent. */

type Params = Promise<{ lang: string; slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => BLOG_KEYS.map((key) => ({ lang, slug: BLOG_SLUGS[key][lang] })));
}

async function resolvePost(params: Params) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return null;
  const key = blogPostFromSlug(lang, slug);
  return key ? { lang, key } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const r = await resolvePost(params);
  return r ? blogPostMetadata(r.lang, getPostMeta(r.lang, r.key)) : {};
}

export default async function BlogPostRoute({ params }: { params: Params }) {
  const r = await resolvePost(params);
  if (!r) notFound();
  const post = await getPost(r.lang, r.key);
  const related = getPosts(r.lang)
    .filter((meta) => meta.key !== r.key)
    .slice(0, 3);
  return <BlogPostPage lang={r.lang} dict={getDictionary(r.lang)} post={post} related={related} />;
}

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import type { MDXContent } from "mdx/types";
import type { Heading, Paragraph, Root, RootContent } from "mdast";
import remarkGfm from "remark-gfm";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { BLOG_KEYS, BLOG_SLUGS, LOCALES, blogPath, type BlogKey, type Locale } from "@/i18n/config";

/**
 * Articles du blog : fichiers MDX de content/blog/<langue>/<slug>.mdx, déclarés dans BLOG_SLUGS
 * (src/i18n/config.ts). Lus et compilés au build : les pages du blog sont statiques.
 *
 * Conventions d’écriture reprises à l’affichage :
 *  - le titre « # … » du fichier est remplacé par l’en-tête de la page (titre, chapô, auteur, couverture) ;
 *  - chaque titre « ## » devient une entrée du sommaire « Sur cette page » ;
 *  - chaque citation (« > ») est un message type, avec un bouton pour le copier ; un paragraphe qui
 *    commence en gras juste avant (« **SMS** », « **E-mail** — Objet : … ») lui sert d’étiquette ;
 *  - un paragraphe qui commence en gras et contient un lien (« **À lire aussi :** [titre](…) ») devient un encart de renvoi ;
 *  - les sections « À retenir » et « Questions fréquentes » ont leur propre mise en forme ;
 *  - ce qui suit le dernier trait horizontal (« --- ») forme l’appel à l’action de fin d’article.
 */

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date au format AAAA-MM-JJ");

const Frontmatter = z.object({
  title: z.string(),
  seoTitle: z.string().optional(),
  description: z.string(),
  slug: z.string(),
  lang: z.enum(LOCALES),
  canonical: z.url(),
  alternates: z.record(z.string(), z.url()).optional(),
  date: isoDate,
  updated: isoDate.optional(),
  author: z.object({ name: z.string(), role: z.string(), url: z.url().optional() }),
  cover: z.object({ src: z.string().startsWith("/"), alt: z.string(), width: z.number().int(), height: z.number().int() }).optional(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  readingTime: z.number().int().positive(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
});

export type PostMeta = z.infer<typeof Frontmatter> & { key: BlogKey; lang: Locale; path: string };
export type TocItem = { id: string; text: string };
export type Post = { meta: PostMeta; Content: MDXContent; toc: TocItem[] };

function fail(file: string, message: string): never {
  throw new Error(`Blog (${file}) : ${message}`);
}

/** Lit un article : en-tête YAML validé et cohérent avec BLOG_SLUGS, puis le corps MDX. */
const readPost = cache((lang: Locale, key: BlogKey): { meta: PostMeta; body: string } => {
  const slug = BLOG_SLUGS[key][lang];
  const file = path.join("content", "blog", lang, `${slug}.mdx`);
  const abs = path.join(process.cwd(), file);
  if (!existsSync(abs)) fail(file, `fichier introuvable (déclaré dans BLOG_SLUGS sous « ${key} »).`);

  const raw = readFileSync(abs, "utf8");
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) fail(file, "en-tête YAML (entre deux lignes « --- ») manquant.");

  const parsed = Frontmatter.safeParse(parseYaml(match[1]));
  if (!parsed.success) fail(file, `en-tête invalide : ${z.prettifyError(parsed.error)}`);
  const data = parsed.data;

  // Les adresses de l’en-tête doivent correspondre à BLOG_SLUGS (seul le chemin compte : le domaine dépend de l’environnement).
  const pathname = (url: string) => new URL(url).pathname.replace(/\/$/, "") || "/";
  if (data.slug !== slug) fail(file, `slug « ${data.slug} » différent de BLOG_SLUGS (« ${slug} »).`);
  if (data.lang !== lang) fail(file, `langue « ${data.lang} » au lieu de « ${lang} ».`);
  if (pathname(data.canonical) !== blogPath(lang, key)) fail(file, `canonical ${data.canonical} ≠ ${blogPath(lang, key)}.`);
  for (const other of LOCALES) {
    const alt = data.alternates?.[other];
    if (alt && pathname(alt) !== blogPath(other, key)) fail(file, `alternates.${other} ${alt} ≠ ${blogPath(other, key)}.`);
  }
  if (data.cover && !existsSync(path.join(PUBLIC_DIR, data.cover.src))) fail(file, `image de couverture introuvable : public${data.cover.src}.`);

  return { meta: { ...data, key, lang, path: blogPath(lang, key) }, body: raw.slice(match[0].length) };
});

/** Vérifie qu’aucun fichier MDX n’a été déposé sans être déclaré dans BLOG_SLUGS (il ne serait jamais publié). */
const checkDeclared = cache(() => {
  for (const lang of LOCALES) {
    const dir = path.join(CONTENT_DIR, lang);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith(".mdx")) continue;
      const slug = name.slice(0, -4);
      if (!BLOG_KEYS.some((key) => BLOG_SLUGS[key][lang] === slug)) {
        fail(path.join("content", "blog", lang, name), "article absent de BLOG_SLUGS (src/i18n/config.ts) : ajoutez-y sa ligne pour le publier.");
      }
    }
  }
});

export function getPostMeta(lang: Locale, key: BlogKey): PostMeta {
  return readPost(lang, key).meta;
}

/** Articles d’une langue, du plus récent au plus ancien. */
export function getPosts(lang: Locale): PostMeta[] {
  checkDeclared();
  return BLOG_KEYS.map((key) => getPostMeta(lang, key)).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

/** Article complet : en-tête, contenu compilé et sommaire. */
export const getPost = cache(async (lang: Locale, key: BlogKey): Promise<Post> => {
  const { meta, body } = readPost(lang, key);
  const toc: TocItem[] = [];
  const { default: Content } = await evaluate(body, {
    ...runtime,
    remarkPlugins: [remarkGfm, [articleStructure, { toc }]],
  });
  return { meta, Content, toc };
});

/* ---------- Mise en forme de l’article (arbre markdown) ---------- */

type Node = Root | RootContent;

function textOf(node: Node): string {
  if ("value" in node && typeof node.value === "string") return node.value;
  return "children" in node ? node.children.map((child) => textOf(child as Node)).join("") : "";
}

/** Ancre lisible et sans accents : « Quand relancer un devis ? » → « quand-relancer-un-devis ». */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Titres de section repérés pour leur mise en forme (comparés sans accents ni casse). */
const KEY_POINTS_TITLES = ["key points", "key takeaways", "in short", "a retenir", "en bref", "lessentiel"];
const FAQ_TITLES = ["frequently asked questions", "faq", "questions frequentes"];

function sectionKind(title: string): string | null {
  const key = slugify(title).replace(/-/g, " ");
  if (KEY_POINTS_TITLES.includes(key)) return "key-points";
  if (FAQ_TITLES.includes(key)) return "faq-section";
  return null;
}

function setData(node: Node, data: { hName?: string; hProperties?: Record<string, unknown> }) {
  const current = (node.data ?? {}) as { hName?: string; hProperties?: Record<string, unknown> };
  node.data = { ...current, ...data, hProperties: { ...current.hProperties, ...data.hProperties } } as Node["data"];
}

const isLabel = (node: RootContent | undefined): node is Paragraph => node?.type === "paragraph" && node.children[0]?.type === "strong";

/** Nœud conteneur rendu tel quel par remark-rehype grâce à data.hName (section, aside). */
function wrapper(tag: string, className: string | null, children: RootContent[], extra: Record<string, unknown> = {}): RootContent {
  return { type: "wrapper", data: { hName: tag, hProperties: { ...(className ? { className: [className] } : {}), ...extra } }, children } as unknown as RootContent;
}

function articleStructure({ toc }: { toc: TocItem[] }) {
  return (tree: Root) => {
    let nodes = [...tree.children];

    // Le titre « # » est affiché par l’en-tête de la page.
    const title = nodes.findIndex((n) => n.type === "heading" && n.depth === 1);
    if (title !== -1) nodes.splice(title, 1);

    // Ce qui suit le dernier trait horizontal : l’appel à l’action de fin d’article.
    const lastBreak = nodes.findLastIndex((n) => n.type === "thematicBreak");
    const closing = lastBreak === -1 ? [] : nodes.slice(lastBreak + 1);
    if (lastBreak !== -1) nodes = nodes.slice(0, lastBreak);

    const used = new Set<string>();
    const anchor = (text: string) => {
      const base = slugify(text) || "section";
      let id = base;
      for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
      used.add(id);
      return id;
    };

    const decorate = (list: RootContent[]) =>
      list.forEach((node, i) => {
        if (node.type === "heading" && node.depth <= 3) setData(node, { hProperties: { id: anchor(textOf(node)) } });
        // Une image seule dans son paragraphe devient une figure.
        if (node.type === "paragraph" && node.children.length === 1 && node.children[0].type === "image") setData(node, { hName: "figure" });
        // Une citation est un message type à copier ; un paragraphe en gras juste avant (« **SMS** ») est son étiquette.
        if (node.type === "blockquote") {
          setData(node, { hProperties: { className: ["template"] } });
          if (isLabel(list[i - 1])) setData(list[i - 1], { hProperties: { className: ["template-label"] } });
        }
        // « **À lire aussi :** [titre](/fr/blog/…) » : renvoi vers un autre article.
        if (isLabel(node) && list[i + 1]?.type !== "blockquote" && node.children.some((child) => child.type === "link")) {
          setData(node, { hProperties: { className: ["read-next"] } });
        }
      });
    decorate(nodes);
    decorate(closing);

    // Chaque titre « ## » ouvre une section ; le texte qui précède le premier reste l’introduction.
    const body: RootContent[] = [];
    let section: RootContent[] | null = null;
    for (const node of nodes) {
      if (node.type === "heading" && node.depth === 2) {
        const heading = node as Heading;
        const id = (heading.data as { hProperties: { id: string } }).hProperties.id;
        const text = textOf(heading);
        toc.push({ id, text });
        section = [heading];
        body.push(wrapper("section", sectionKind(text), section, { ariaLabelledBy: id }));
      } else if (section) {
        section.push(node);
      } else {
        body.push(node);
      }
    }

    // Dans l’appel final, un lien seul dans son paragraphe devient un bouton.
    for (const node of closing) {
      if (node.type === "paragraph" && node.children.length === 1 && node.children[0].type === "link") setData(node.children[0] as Node, { hProperties: { className: ["btn"] } });
    }
    if (closing.length) body.push(wrapper("aside", "post-cta", closing));

    tree.children = body;
  };
}

/* ---------- Images ---------- */

const svgSizes = new Map<string, { width: number; height: number } | null>();

/** Dimensions d’un SVG de public/ (attributs width/height ou viewBox), pour réserver sa place avant chargement. */
export function svgSize(src: string): { width: number; height: number } | null {
  if (!src.startsWith("/") || !src.endsWith(".svg")) return null;
  if (!svgSizes.has(src)) {
    let size: { width: number; height: number } | null = null;
    try {
      const head = readFileSync(path.join(PUBLIC_DIR, src), "utf8").slice(0, 600);
      const w = /\swidth="(\d+(?:\.\d+)?)"/.exec(head);
      const h = /\sheight="(\d+(?:\.\d+)?)"/.exec(head);
      const box = /viewBox="[\d.\s-]+?\s([\d.]+)\s([\d.]+)"/.exec(head);
      if (w && h) size = { width: Number(w[1]), height: Number(h[1]) };
      else if (box) size = { width: Number(box[1]), height: Number(box[2]) };
    } catch {
      size = null;
    }
    svgSizes.set(src, size);
  }
  return svgSizes.get(src) ?? null;
}

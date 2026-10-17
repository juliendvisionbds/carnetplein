import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import { PostToc, TemplateQuote } from "@/components/BlogClient";
import { TradeLinks } from "@/components/TradePages";
import type { Dictionary } from "@/i18n";
import { INTL_TAG, blogPath, fmt, localePath, pagePath, type Locale } from "@/i18n/config";
import { blogIndexStructuredData, blogPostStructuredData, jsonLdScript } from "@/i18n/metadata";
import { svgSize, type Post, type PostMeta } from "@/lib/blog";
import { TEAM } from "@/lib/content";

/**
 * Blog : la page des articles (/blog ↔ /fr/blog) et la page d’un article, construite sur deux colonnes
 * comme les articles de visionbtp.com : sommaire collant et diagnostic à gauche, article à droite.
 */

type BlogText = Dictionary["blog"];

function formatDate(lang: Locale, iso: string) {
  return new Intl.DateTimeFormat(INTL_TAG[lang], { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

/** Fil d’Ariane visible : accueil, puis le blog (lien depuis un article), repris dans les données structurées. */
function Crumbs({ lang, dict, inPost }: { lang: Locale; dict: Dictionary; inPost?: boolean }) {
  return (
    <nav className="crumbs" aria-label={dict.trades.crumbAria}>
      <Link href={localePath(lang, "/")}>{dict.trades.crumbHome}</Link>
      {inPost ? <Link href={blogPath(lang)}>{dict.blog.crumb}</Link> : <span aria-current="page">{dict.blog.crumb}</span>}
    </nav>
  );
}

/** Auteur : photo (membre de l’équipe du même nom), nom et rôle. Dans un article, le nom mène à la page Équipe. */
function Byline({ lang, meta, link }: { lang: Locale; meta: PostMeta; link?: boolean }) {
  const member = TEAM.find((m) => m.name === meta.author.name);
  const initials = meta.author.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="byline">
      {member ? (
        <Image src={member.photo} alt="" width={40} height={40} />
      ) : (
        <span className="byline-initials" aria-hidden="true">
          {initials}
        </span>
      )}
      <span>
        {link ? <Link href={pagePath(lang, "team")}>{meta.author.name}</Link> : <b>{meta.author.name}</b>}
        <small>{meta.author.role}</small>
      </span>
    </div>
  );
}

function PostFacts({ lang, t, meta }: { lang: Locale; t: BlogText; meta: PostMeta }) {
  return (
    <div className="post-facts">
      <time dateTime={meta.date}>{formatDate(lang, meta.date)}</time>
      <span>{fmt(t.readingTime, { minutes: meta.readingTime })}</span>
      {meta.updated && meta.updated !== meta.date && <span>{fmt(t.updated, { date: formatDate(lang, meta.updated) })}</span>}
    </div>
  );
}

/** Carte d’article : toute la carte est cliquable (le lien du titre la recouvre). */
function PostCard({ lang, t, meta, featured, level = 2 }: { lang: Locale; t: BlogText; meta: PostMeta; featured?: boolean; level?: 2 | 3 }) {
  const Title = level === 3 ? "h3" : "h2";
  return (
    <article className={featured ? "post-card featured" : "post-card"}>
      {meta.cover && (
        <div className="post-card-media">
          <Image
            src={meta.cover.src}
            alt={meta.cover.alt}
            width={meta.cover.width}
            height={meta.cover.height}
            sizes={featured ? "(max-width: 900px) 100vw, 680px" : "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 420px"}
            preload={featured}
          />
        </div>
      )}
      <div className="post-card-body">
        <span className="post-card-cat">{featured ? `${t.latest} · ${meta.category}` : meta.category}</span>
        <Title>
          <Link href={meta.path}>{meta.title}</Link>
        </Title>
        <p>{meta.description}</p>
        <div className="post-card-foot">
          <Byline lang={lang} meta={meta} />
          <PostFacts lang={lang} t={t} meta={meta} />
        </div>
        <span className="post-card-more" aria-hidden="true">
          {t.readArticle}
        </span>
      </div>
    </article>
  );
}

function DiagnosticBand({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const home = dict.home;
  return (
    <div className="cta-band">
      <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
        {home.ctaEyebrow}
      </div>
      <h2>{home.ctaTitle}</h2>
      <p>{home.ctaIntro}</p>
      <Link className="btn" href={localePath(lang, "/diagnostic")}>
        {home.cta}
      </Link>
    </div>
  );
}

export function BlogIndex({ lang, dict, posts }: { lang: Locale; dict: Dictionary; posts: PostMeta[] }) {
  const t = dict.blog;
  const [featured, ...others] = posts;
  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(blogIndexStructuredData(lang, posts))} />
      <div className="page-head">
        <Crumbs lang={lang} dict={dict} />
        <div className="eyebrow">{t.eyebrow}</div>
        <h1>{t.h1}</h1>
        <p>{t.intro}</p>
      </div>

      {featured && <PostCard lang={lang} t={t} meta={featured} featured />}
      {others.length > 0 && (
        <div className="post-grid">
          {others.map((meta) => (
            <PostCard key={meta.key} lang={lang} t={t} meta={meta} />
          ))}
        </div>
      )}

      <section className="trade-others blog-trades">
        <h2>{t.trades}</h2>
        <TradeLinks lang={lang} t={dict.trades} />
      </section>

      <DiagnosticBand lang={lang} dict={dict} />
    </div>
  );
}

/** Rendu des éléments de l’article : liens internes sans rechargement, schémas dimensionnés, modèles à copier. */
function postComponents(t: BlogText): MDXComponents {
  return {
    a: ({ href = "", className, children }) => {
      if (href.startsWith("/"))
        return (
          <Link href={href} className={className}>
            {children}
          </Link>
        );
      if (href.startsWith("#"))
        return (
          <a href={href} className={className}>
            {children}
          </a>
        );
      return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    // Schémas SVG servis tels quels (rien à optimiser) ; leurs dimensions, lues dans le fichier, réservent leur place.
    img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" decoding="async" {...(typeof src === "string" ? svgSize(src) : null)} />,
    blockquote: ({ className, children }) =>
      className?.includes("template") ? (
        <TemplateQuote copy={t.copy} copied={t.copied}>
          {children}
        </TemplateQuote>
      ) : (
        <blockquote className={className}>{children}</blockquote>
      ),
    table: (props) => (
      <div className="table-scroll">
        <table {...props} />
      </div>
    ),
  };
}

export function BlogPostPage({ lang, dict, post, related }: { lang: Locale; dict: Dictionary; post: Post; related: PostMeta[] }) {
  const t = dict.blog;
  const { meta, Content, toc } = post;
  const diagnosticHref = localePath(lang, "/diagnostic");

  return (
    <div className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(blogPostStructuredData(lang, meta))} />
      <div className="post-layout">
        <aside className="post-aside">
          {toc.length > 0 && <PostToc items={toc} title={t.onThisPage} />}
          <div className="post-aside-card">
            <span className="post-aside-tag">{t.asideEyebrow}</span>
            <b>{t.asideTitle}</b>
            <p>{t.asideText}</p>
            <Link href={diagnosticHref}>{t.asideCta}</Link>
          </div>
        </aside>

        <article className="post">
          <header className="post-head">
            <Crumbs lang={lang} dict={dict} inPost />
            <div className="eyebrow">{meta.category}</div>
            <h1>{meta.title}</h1>
            <p className="post-lead">{meta.description}</p>
            <div className="post-meta">
              <Byline lang={lang} meta={meta} link />
              <PostFacts lang={lang} t={t} meta={meta} />
            </div>
          </header>

          {meta.cover && (
            <figure className="post-cover">
              <Image src={meta.cover.src} alt={meta.cover.alt} width={meta.cover.width} height={meta.cover.height} sizes="(max-width: 900px) 100vw, 760px" preload />
            </figure>
          )}

          {toc.length > 0 && (
            <details className="post-toc-mobile">
              <summary>{t.onThisPage}</summary>
              <ol>
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`}>{item.text}</a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div className="post-body">
            <Content components={postComponents(t)} />
          </div>
        </article>
      </div>

      {related.length > 0 && (
        <section className="post-more" aria-labelledby="post-more">
          <div className="post-more-head">
            <h2 id="post-more">{t.more}</h2>
            <Link href={blogPath(lang)}>{t.all}</Link>
          </div>
          <div className="post-grid">
            {related.map((other) => (
              <PostCard key={other.key} lang={lang} t={t} meta={other} level={3} />
            ))}
          </div>
        </section>
      )}

      <section className="trade-others post-trades">
        <h2>{t.trades}</h2>
        <TradeLinks lang={lang} t={dict.trades} />
        {related.length === 0 && (
          <Link className="post-all" href={blogPath(lang)}>
            {t.all}
          </Link>
        )}
      </section>
    </div>
  );
}

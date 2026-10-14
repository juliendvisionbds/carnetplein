import { guessTrade } from "@/lib/trades";

export type SiteInfo = { title: string | null; description: string | null; trade: string | null };

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, name: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i");
  const m = html.match(re) ?? html.match(re2);
  return m ? decode(m[1]).slice(0, 300) || null : null;
}

/**
 * Lit le titre et la description du site du prospect, puis en déduit un métier probable.
 * Meilleur effort : en cas d’échec (site lent, bloqué, hors ligne), tout reste à null.
 */
export async function fetchSiteInfo(url: string, timeoutMs = 4000): Promise<SiteInfo> {
  const empty: SiteInfo = { title: null, description: null, trade: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // User-Agent de navigateur : beaucoup de sites renvoient une page vide ou un refus aux robots déclarés.
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return empty;
    const html = (await res.text()).slice(0, 300_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const info: SiteInfo = {
      title: title ? decode(title).slice(0, 200) || null : null,
      description: meta(html, "description") ?? meta(html, "og:description"),
      trade: null,
    };
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const corpus = [info.title, info.description, h1 ? decode(h1.replace(/<[^>]+>/g, " ")) : null, meta(html, "keywords"), url]
      .filter(Boolean)
      .join(" ");
    info.trade = guessTrade(corpus);
    return info;
  } catch {
    return empty;
  } finally {
    clearTimeout(timer);
  }
}

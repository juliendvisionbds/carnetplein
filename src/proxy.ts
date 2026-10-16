import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, hasLocale, negotiateLocale, switchLocalePath } from "@/i18n/config";

/**
 * Routage des langues.
 *  - L’anglais vit à la racine (/), le français sous /fr.
 *  - Sans préfixe, un visiteur dont le navigateur préfère le français est envoyé vers la même page
 *    sous /fr, segments traduits compris (/privacy → /fr/confidentialite), par redirection temporaire
 *    307 comme le recommande Google pour les redirections linguistiques ; son choix est mémorisé dans un cookie.
 *  - Un changement de langue explicite (lien EN/FR) pose le cookie avant de naviguer : il est
 *    toujours respecté. Sans cookie et sans préférence française, la page anglaise est servie
 *    par réécriture interne vers app/[lang] (lang = "en"), l’adresse restant sans préfixe.
 *  - /en/... n’est pas une adresse publique : redirection permanente vers l’adresse canonique.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(DEFAULT_LOCALE.length + 1) || "/";
    return NextResponse.redirect(url, 308);
  }
  if (hasLocale(first)) return NextResponse.next();

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = cookie ? (hasLocale(cookie) ? cookie : DEFAULT_LOCALE) : negotiateLocale(request.headers.get("accept-language"));
  if (preferred === DEFAULT_LOCALE) return serveDefault(request);

  const url = request.nextUrl.clone();
  url.pathname = switchLocalePath(pathname, preferred);
  const response = NextResponse.redirect(url, 307);
  if (!cookie) {
    response.cookies.set(LOCALE_COOKIE, preferred, { path: "/", maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: "lax" });
  }
  return response;
}

/** Sert la page anglaise (app/[lang] avec lang = "en") sans changer l’adresse visible. */
function serveDefault(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Tout sauf l’API, le back-office, les ressources internes, les images générées
  // (/apple-icon, /en/opengraph-image/…, /fr/opengraph-image/…) et les fichiers (icône, sitemap…).
  matcher: ["/((?!api|admin|_next|apple-icon|(?:[^/]+/)?opengraph-image|.*\\..*).*)"],
};

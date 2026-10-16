import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import { getDictionary } from "@/i18n";
import { DEFAULT_LOCALE, hasLocale, localePath } from "@/i18n/config";

export default async function NotFound() {
  const raw = await rootLang();
  const lang = hasLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = getDictionary(lang).notFound;
  return (
    <div className="wrap">
      <section className="cta-band" style={{ marginTop: 50 }}>
        <h2>{t.title}</h2>
        <p>{t.text}</p>
        <Link className="btn" href={localePath(lang, "/diagnostic")}>
          {t.cta}
        </Link>
      </section>
    </div>
  );
}

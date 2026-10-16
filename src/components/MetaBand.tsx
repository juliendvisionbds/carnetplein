import type { Dictionary } from "@/i18n";

type Props = {
  t: Dictionary["metaBand"];
  /** Bouton affiché à la place de la punchline. */
  cta?: { href: string; label: string };
};

/** La bande « méta » : le parcours vécu par le prospect est exactement celui que vivront ses clients. */
export function MetaBand({ t, cta }: Props) {
  return (
    <section className="meta-band" aria-label={t.aria}>
      <div>
        <div className="eyebrow">{t.eyebrow}</div>
        <h2>{t.title}</h2>
        <p>{t.body}</p>
        {cta ? (
          <a className="btn" href={cta.href}>
            {cta.label} <span>↗</span>
          </a>
        ) : (
          <span className="punch">{t.punchline}</span>
        )}
      </div>
      <div className="mirror" aria-hidden="true">
        <div className="col">
          <b>{t.left}</b>
          {t.steps.map((s) => (
            <div key={s}>
              <i /> {s}
            </div>
          ))}
        </div>
        <div className="eq">=</div>
        <div className="col">
          <b>{t.right}</b>
          {t.steps.map((s) => (
            <div key={s}>
              <i /> {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

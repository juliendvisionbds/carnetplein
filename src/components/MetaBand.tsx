type Props = {
  eyebrow: string;
  title: string;
  body: string;
  punchline?: string;
  /** Bouton affiché à la place de la punchline. */
  cta?: { href: string; label: string };
  /** Libellés des deux colonnes du miroir. */
  left?: string;
  right?: string;
};

const STEPS = ["Les bonnes questions", "Une réponse immédiate", "Une page à son nom", "Un suivi jusqu’à la décision"];

/** La bande « méta » : le parcours vécu par le prospect est exactement celui que vivront ses clients. */
export function MetaBand({ eyebrow, title, body, punchline, cta, left = "Vous, à l’instant", right = "Vos clients, demain" }: Props) {
  return (
    <section className="meta-band" aria-label="Le parcours que vous venez de vivre">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{body}</p>
        {cta ? (
          <a className="btn" href={cta.href}>
            {cta.label} <span>↗</span>
          </a>
        ) : (
          punchline && <span className="punch">{punchline}</span>
        )}
      </div>
      <div className="mirror" aria-hidden="true">
        <div className="col">
          <b>{left}</b>
          {STEPS.map((s) => (
            <div key={s}>
              <i /> {s}
            </div>
          ))}
        </div>
        <div className="eq">=</div>
        <div className="col">
          <b>{right}</b>
          {STEPS.map((s) => (
            <div key={s}>
              <i /> {s}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

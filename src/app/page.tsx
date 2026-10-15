import Link from "next/link";
import { MetaBand } from "@/components/MetaBand";
import { META_TEASER, PRICING } from "@/lib/content";

export default function HomePage() {
  return (
    <div className="wrap">
      <div className="hero">
        <div>
          <div className="eyebrow">Pour les entreprises qui vendent sur devis</div>
          <h1>
            Des demandes,
            <br />
            vous en avez.
            <br />
            <em>Et les signatures ?</em>
          </h1>
          <p>Découvrez où vos projets se perdent, et quoi améliorer pour transformer plus de demandes en clients.</p>
          <Link className="btn" href="/diagnostic">
            Trouver mon point de blocage <span>↗</span>
          </Link>
          <div className="micro">3 minutes · Gratuit · Résultat immédiat</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-label">Le parcours que vos demandes méritent</div>
          <div className="paper">
            <div className="paper-top">
              <b>Un projet qui avance.</b>
              <span className="badge">Exemple de parcours</span>
            </div>
            <div className="flow-row">
              <span className="ico">↳</span>
              <div>
                <strong>Une nouvelle demande</strong>
                <small>Le projet, la zone, le bon timing.</small>
              </div>
              <span className="tick">✓</span>
            </div>
            <div className="flow-row">
              <span className="ico">↗</span>
              <div>
                <strong>Une réponse, tout de suite</strong>
                <small>« Votre projet est bien entre nos mains. »</small>
              </div>
              <span className="tick">✓</span>
            </div>
            <div className="flow-row">
              <span className="ico">◷</span>
              <div>
                <strong>Un devis suivi, pas oublié</strong>
                <small>La bonne relance, au bon moment.</small>
              </div>
              <span className="tick">✓</span>
            </div>
            <div className="flow-row">
              <span className="ico">▤</span>
              <div>
                <strong>La prochaine action est claire</strong>
                <small>Qui rappeler, et pourquoi.</small>
              </div>
            </div>
          </div>
          <div className="notification">
            <b>Une conversation qui reprend.</b>« Merci pour votre suivi. On peut faire le point demain ? »
            <div className="micro">Message illustratif</div>
          </div>
        </div>
      </div>

      <ul className="reassure" aria-label="Ce que vous pouvez attendre">
        <li>
          <b>Sans refaire votre site</b>
          <span>Une page de demande qui s’ajoute à l’existant.</span>
        </li>
        <li>
          <b>Installé en deux semaines</b>
          <span>Parcours et messages préparés avec vous.</span>
        </li>
        <li>
          <b>Pas de logiciel à apprendre</b>
          <span>Une liste claire de qui rappeler, et pourquoi.</span>
        </li>
        <li>
          <b>Sans engagement de durée</b>
          <span>Démo gratuite, vous décidez après l’avoir vue.</span>
        </li>
      </ul>

      <section className="block">
        <div className="section-head">
          <div className="eyebrow">Avant de chercher plus de contacts</div>
          <h2>
            Regardons ce qu’il se passe
            <br />
            avec ceux que vous avez.
          </h2>
          <p>Une demande n’est pas encore un client. Entre les deux, quelques moments font toute la différence.</p>
        </div>
        <div className="three">
          <article className="feature">
            <span className="num">01 / LE PREMIER CONTACT</span>
            <h3>
              « Je le rappelle
              <br />
              tout à l’heure. »
            </h3>
            <p>La journée avance, les demandes s’accumulent. Votre prospect, lui, attend une réponse.</p>
          </article>
          <article className="feature">
            <span className="num">02 / LE PROJET À COMPRENDRE</span>
            <h3>
              « Il me manque
              <br />
              encore une info. »
            </h3>
            <p>Le besoin est flou, les échanges s’éparpillent. Le devis n’avance pas comme prévu.</p>
          </article>
          <article className="feature">
            <span className="num">03 / LE DEVIS EN ATTENTE</span>
            <h3>
              « S’il est intéressé,
              <br />
              il reviendra. »
            </h3>
            <p>Parfois oui. Parfois il a une question, une hésitation ou simplement besoin d’un suivi.</p>
          </article>
        </div>
      </section>

      <MetaBand
        eyebrow={META_TEASER.eyebrow}
        title={META_TEASER.title}
        body={META_TEASER.body}
        left="Vous, dans 3 minutes"
        right="Vos clients, demain"
      />

      <section className="block">
        <div className="dark-block" id="methode">
          <div>
            <div className="eyebrow">La méthode Carnet Plein</div>
            <h2 style={{ marginTop: 20 }}>
              D’abord comprendre.
              <br />
              Ensuite, faire avancer.
            </h2>
            <p>Pas besoin de changer tout votre quotidien. On identifie le point de blocage et on construit le parcours autour.</p>
            <Link className="btn lime" href="/diagnostic">
              Faire mon diagnostic ↗
            </Link>
          </div>
          <div className="steps">
            <div className="step">
              <b>1</b>
              <div>
                <h4>Vous nous racontez votre quotidien.</h4>
                <p>Neuf questions sur vos demandes, vos devis et votre façon de les suivre. Trois minutes.</p>
              </div>
            </div>
            <div className="step">
              <b>2</b>
              <div>
                <h4>Vous recevez votre diagnostic, tout de suite.</h4>
                <p>Votre priorité, trois actions concrètes et un espace personnel pour tout retrouver. Même si vous n’allez pas plus loin.</p>
              </div>
            </div>
            <div className="step">
              <b>3</b>
              <div>
                <h4>On construit la démo complète de votre tunnel de vente.</h4>
                <p>À vos couleurs, pour votre métier. On vous l’envoie, puis on en parle 15 minutes. Vous décidez après l’avoir vue.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="block faq">
        <h2>Les questions légitimes.</h2>
        <details>
          <summary>Est-ce que vous remplacez mon site ?</summary>
          <p>
            Non. Carnet Plein ajoute une page de demande et un parcours de suivi adaptés à votre entreprise. L’installation prend deux
            semaines, sans refaire votre site.
          </p>
        </details>
        <details>
          <summary>Est-ce que vous m’apportez de nouveaux contacts ?</summary>
          <p>
            L’offre vise à mieux traiter et suivre les demandes que vous recevez déjà. Si votre difficulté principale est le manque de
            demandes, le diagnostic vous le signalera : le suivi seul ne remplace pas une stratégie d’acquisition.
          </p>
        </details>
        <details>
          <summary>Dois-je payer avant de voir le résultat ?</summary>
          <p>
            Non. Le diagnostic est gratuit et immédiat. La démo de votre tunnel de vente est gratuite aussi. Si elle vous plaît, on en parle
            15 minutes, puis l’installation ({PRICING.setup}) et le suivi ({PRICING.monthly}) viennent ensuite, {PRICING.footnote.toLowerCase()}.
          </p>
        </details>
        <details>
          <summary>Est-ce un nouveau logiciel à gérer ?</summary>
          <p>
            Nous installons le parcours et préparons les messages avec vous. Vous gardez la relation avec vos clients et une liste claire
            des prochaines actions. La compatibilité avec vos outils est vérifiée avant l’installation.
          </p>
        </details>
        <details>
          <summary>Que faites-vous de mes informations ?</summary>
          <p>
            Elles servent à préparer votre diagnostic, votre démo et à vous recontacter à ce sujet. Rien d’autre. Vous pouvez demander leur
            suppression à tout moment. Détails sur la page <Link href="/confidentialite">Confidentialité</Link>.
          </p>
        </details>
      </section>

      <div className="cta-band">
        <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
          Votre prochaine signature commence peut-être ici
        </div>
        <h2>Quel est votre point de blocage ?</h2>
        <p>Trois minutes pour prendre du recul sur votre parcours commercial.</p>
        <Link className="btn" href="/diagnostic">
          Faire mon diagnostic gratuit ↗
        </Link>
      </div>
    </div>
  );
}

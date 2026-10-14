import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap">
      <section className="cta-band" style={{ marginTop: 50 }}>
        <h2>Cette page n’existe pas, ou plus.</h2>
        <p>Si vous cherchiez votre espace, utilisez le lien reçu par e-mail. Sinon, le diagnostic est à trois minutes d’ici.</p>
        <Link className="btn" href="/diagnostic">
          Faire mon diagnostic ↗
        </Link>
      </section>
    </div>
  );
}

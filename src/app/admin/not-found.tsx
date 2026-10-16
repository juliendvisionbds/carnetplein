import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="wrap">
      <section className="cta-band" style={{ marginTop: 50 }}>
        <h2>Ce dossier n’existe pas, ou plus.</h2>
        <p>Il a peut-être été supprimé depuis le pilotage.</p>
        <Link className="btn" href="/admin">
          Retour au pilotage ↗
        </Link>
      </section>
    </div>
  );
}

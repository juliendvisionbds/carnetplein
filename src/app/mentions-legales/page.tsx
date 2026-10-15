import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/content";

export const metadata: Metadata = { title: "Mentions légales" };

/**
 * Les champs entre crochets sont à compléter avec l’identité juridique de l’agence
 * (raison sociale, forme, capital, siège, immatriculation, contact, directeur de la publication).
 */
const EDITOR = {
  name: "[Raison sociale de l’agence]",
  form: "[Forme juridique, capital social]",
  address: "[Adresse du siège social]",
  registration: "[RCS ville et numéro, ou SIREN]",
  vat: "[Numéro de TVA intracommunautaire]",
  email: "[Adresse e-mail de contact]",
  director: "[Nom du directeur ou de la directrice de la publication]",
};

export default function LegalPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="eyebrow">Mentions légales</div>
        <h1>Qui édite ce site.</h1>
        <p>Les informations légales relatives au site {SITE.name}.</p>
      </div>
      <div className="panel" style={{ maxWidth: 760, marginBottom: 70 }}>
        <h3>Éditeur</h3>
        <p>
          Le site {SITE.name} est édité par {EDITOR.name}, {EDITOR.form}, dont le siège social est situé {EDITOR.address}, immatriculée au{" "}
          {EDITOR.registration}. TVA intracommunautaire : {EDITOR.vat}.
          <br />
          Contact : {EDITOR.email}.
          <br />
          Directeur de la publication : {EDITOR.director}.
        </p>

        <h3>Hébergement</h3>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com). Les données du
          diagnostic sont stockées par Supabase (supabase.com) et les e-mails sont envoyés par Resend (resend.com).
        </p>

        <h3>Propriété intellectuelle</h3>
        <p>
          L’ensemble des contenus de ce site (textes, visuels, logo, structure du diagnostic) est la propriété de l’éditeur. Toute
          reproduction, même partielle, sans autorisation écrite préalable est interdite.
        </p>

        <h3>Données personnelles</h3>
        <p>
          Les informations collectées lors du diagnostic servent à produire votre diagnostic, construire votre démo et vous recontacter à ce
          sujet. Le détail, vos droits et la durée de conservation sont décrits sur la page{" "}
          <Link href="/confidentialite" style={{ textDecoration: "underline" }}>
            Confidentialité
          </Link>
          .
        </p>

        <h3>Responsabilité</h3>
        <p>
          Le diagnostic proposé est indicatif et repose sur vos réponses déclaratives. Il ne constitue ni un audit vérifié ni une garantie de
          résultat commercial.
        </p>
      </div>
    </div>
  );
}

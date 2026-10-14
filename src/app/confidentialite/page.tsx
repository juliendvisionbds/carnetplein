import type { Metadata } from "next";
import { SITE } from "@/lib/content";

export const metadata: Metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="eyebrow">Confidentialité</div>
        <h1>Vos informations, et ce qu’on en fait.</h1>
        <p>Une page courte, parce que la réponse est courte.</p>
      </div>
      <div className="panel" style={{ maxWidth: 760, marginBottom: 70 }}>
        <h3>Ce que nous collectons</h3>
        <p>
          Lors du diagnostic : vos réponses aux questions, votre nom, votre e-mail, l’adresse de votre site et, si vous les indiquez, le nom
          de votre entreprise, votre téléphone et un contexte libre. Nous conservons aussi la source de votre visite (par exemple le
          site qui vous a amené ici) et les actions réalisées dans votre espace (ouverture, prise de rendez-vous).
        </p>
        <h3>Pourquoi</h3>
        <p>
          Pour produire votre diagnostic, construire la démo de votre tunnel de vente, vous l’envoyer et vous proposer un échange à ce
          sujet. Ces informations ne sont ni vendues ni partagées à des fins publicitaires.
        </p>
        <h3>Où</h3>
        <p>
          Les données sont hébergées chez Supabase (base de données) et Vercel (application). Les e-mails sont envoyés via Resend. Votre
          espace personnel est accessible par un lien privé que vous seul recevez.
        </p>
        <h3>Combien de temps</h3>
        <p>
          Le temps de l’échange commercial, puis au plus 24 mois après notre dernier contact. Vous pouvez demander à tout moment l’accès,
          la correction ou la suppression de vos informations.
        </p>
        <h3>Pour nous écrire</h3>
        <p>
          Répondez simplement à l’un de nos e-mails, ou contactez {SITE.name} à l’adresse indiquée dans nos messages.
          {/* À compléter : raison sociale, adresse postale et e-mail de contact de l’agence. */}
        </p>
      </div>
    </div>
  );
}

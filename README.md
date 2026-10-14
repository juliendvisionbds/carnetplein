# Carnet Plein

Page de présentation, funnel de vente (diagnostic gratuit → espace prospect → prise de rendez-vous) et back-office de suivi commercial.

**Stack :** Next.js 16 (App Router, TypeScript) · Supabase (Postgres) · Resend (e-mails) · Vercel (hébergement).

## Le parcours

| Étape | URL | Ce qui se passe |
|---|---|---|
| Présentation | `/` | Page d’accueil, méthode, FAQ, bande « méta » |
| Diagnostic | `/diagnostic` | 9 questions puis **coordonnées** (nom, e-mail, site obligatoires) ; le métier est détecté depuis le site |
| Espace prospect | `/espace/<token>` | Diagnostic, plan d’action, bande « plot twist », **CTA principal : réserver un appel**, timeline « démo en préparation » |
| Pilotage | `/admin` | Kanban des dossiers, fiche lead, notes, envoi de la démo, export CSV |

Chaque prospect reçoit par e-mail le lien privé de son espace. L’équipe reçoit un e-mail à chaque nouveau diagnostic et à chaque demande de rendez-vous.

## Installation locale

```bash
npm install
cp .env.example .env.local   # puis renseignez au minimum ADMIN_PASSWORD
npm run dev
```

Sans Supabase configuré, les dossiers sont stockés dans `.data/leads.json` (développement uniquement). Sans Resend, les e-mails sont simplement journalisés dans la console.

## Mise en production

### 1. Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Ouvrez **SQL Editor**, collez le contenu de [`supabase/schema.sql`](supabase/schema.sql) et exécutez-le.
3. Dans **Project Settings → API**, récupérez l’URL du projet et la clé **service_role**.

Les tables ont le RLS activé sans aucune policy : seule l’application, côté serveur, y accède avec la clé service_role. Ne mettez jamais cette clé dans une variable `NEXT_PUBLIC_*`.

### 2. Resend (e-mails)

1. Créez un compte sur [resend.com](https://resend.com), ajoutez et vérifiez votre domaine.
2. Créez une clé API.
3. Renseignez `EMAIL_FROM` avec une adresse de ce domaine et `AGENCY_NOTIFY_EMAIL` avec l’adresse qui doit recevoir les leads.

### 3. Prise de rendez-vous

Renseignez `NEXT_PUBLIC_BOOKING_URL` avec le lien de votre créneau « 15 min » sur Cal.com ou Calendly. L’agenda s’affiche directement dans l’espace du prospect, prérempli avec son nom et son e-mail, et un rendez-vous confirmé fait passer le dossier en « Rendez-vous pris ».

Sans lien, l’espace propose un formulaire de demande de créneau (jour + heure) : vous recevez la demande par e-mail et la confirmez vous-même.

### 4. Vercel

1. Poussez le dépôt sur GitHub, puis importez-le dans [vercel.com](https://vercel.com) (framework détecté : Next.js).
2. Dans **Settings → Environment Variables**, ajoutez les variables de `.env.example` :

| Variable | Obligatoire | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | oui | URL publique, utilisée dans les e-mails |
| `SUPABASE_URL` | oui | URL du projet Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | oui | Clé service_role (serveur uniquement) |
| `ADMIN_PASSWORD` | oui | Mot de passe du back-office `/admin` |
| `ADMIN_SESSION_SECRET` | recommandé | Secret de signature des sessions (`openssl rand -base64 32`) |
| `RESEND_API_KEY` | recommandé | Envoi des e-mails |
| `EMAIL_FROM` | recommandé | Expéditeur vérifié dans Resend |
| `AGENCY_NOTIFY_EMAIL` | recommandé | Reçoit les nouveaux leads et demandes de RDV |
| `NEXT_PUBLIC_BOOKING_URL` | facultatif | Lien Cal.com / Calendly |

   Ou, sans saisie manuelle, depuis votre poste une fois connecté au CLI (`npx vercel login`) et le dossier lié (`npx vercel link`) :

   ```bash
   scripts/vercel-env-push.sh production
   ```

   Le script lit `.env.local`, pousse chaque variable (les secrets en mode « sensitive ») et n'affiche jamais les valeurs. `EXCLUDE="NEXT_PUBLIC_SITE_URL" scripts/vercel-env-push.sh production` ignore une variable, utile quand l'URL locale diffère de l'URL de production.

3. Déployez. Testez le parcours complet avec votre propre e-mail, puis supprimez le dossier de test depuis `/admin`.

## Personnaliser

- **Textes commerciaux, prix, phrase « méta »** : [`src/lib/content.ts`](src/lib/content.ts)
- **Questions, profils, règles de scoring** : [`src/lib/diagnostic.ts`](src/lib/diagnostic.ts) (voir [`docs/ANALYSE-DIAGNOSTIC.md`](docs/ANALYSE-DIAGNOSTIC.md))
- **E-mails** : [`src/lib/email.ts`](src/lib/email.ts)
- **Style** : [`src/app/globals.css`](src/app/globals.css)
- **Page Confidentialité** : complétez l’identité de l’agence dans [`src/app/confidentialite/page.tsx`](src/app/confidentialite/page.tsx)

## Suivi commercial

Les étapes du pipeline : Nouveau → Démo en préparation → Démo envoyée → Rendez-vous pris → Client signé (ou Perdu).

- Un nouveau diagnostic arrive en **Nouveau**. Un diagnostic refait avec le même e-mail met à jour le dossier existant sans doublon.
- Collez l’URL de la démo dans la fiche : le dossier passe en **Démo envoyée**, le prospect reçoit l’e-mail « Votre démo est prête » et le lien apparaît dans son espace.
- Un rendez-vous (agenda intégré ou formulaire) passe le dossier en **Rendez-vous pris**.
- Le journal d’activité montre les ouvertures d’espace, les consultations de la démo et les téléchargements de synthèse.
- « La liste du matin » sur `/admin` propose la prochaine action pour chaque dossier actif.

## Démo d’origine

La maquette statique initiale (HTML/JS, localStorage) est conservée dans [`legacy-demo/`](legacy-demo/) pour référence. Elle n’est plus utilisée.

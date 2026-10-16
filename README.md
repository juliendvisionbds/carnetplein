# Vision

Site bilingue (anglais par défaut, français sous `/fr`), funnel de vente (diagnostic gratuit → espace prospect → prise de rendez-vous) et back-office de suivi commercial.

**Stack :** Next.js 16 (App Router, TypeScript) · Supabase (Postgres) · Resend (e-mails) · Vercel (hébergement). Domaine cible : visionbds.com.

## Le parcours

| Étape | Anglais | Français | Ce qui se passe |
|---|---|---|---|
| Présentation | `/` | `/fr` | Page d’accueil, méthode, FAQ, bande « méta » |
| Diagnostic | `/diagnostic` | `/fr/diagnostic` | 9 questions puis **coordonnées** (nom, e-mail, site obligatoires) ; le métier est détecté depuis le site |
| Espace prospect | `/espace/<token>` | `/fr/espace/<token>` | Diagnostic, plan d’action, bande « plot twist », **CTA principal : réserver un appel**, timeline « démo en préparation » |
| Confidentialité | `/privacy` | `/fr/confidentialite` | Page légale |
| Mentions légales | `/legal-notice` | `/fr/mentions-legales` | Page légale (identité de l’agence dans `src/lib/content.ts`) |
| Pilotage | `/admin` | — | Kanban des dossiers, fiche lead, notes, envoi de la démo, export CSV (toujours en français) |

Chaque prospect reçoit par e-mail, dans sa langue, le lien privé de son espace. L’équipe reçoit un e-mail en français à chaque nouveau diagnostic et à chaque demande de rendez-vous, avec la langue du prospect.

## Les deux langues

- **Routage** : `src/proxy.ts`. L’anglais est servi à la racine sans préfixe ; le français sous `/fr`. À la première visite d’une adresse sans préfixe, un navigateur qui préfère le français est redirigé (307) vers `/fr` et un cookie `lang` mémorise ce choix. Le lien EN/FR du site pose ce cookie explicitement : il est toujours respecté. `/en/...` redirige (308) vers l’adresse canonique sans préfixe.
- **SEO** : attribut `lang` sur `<html>`, balise canonique et `hreflang` (`en`, `fr`, `x-default` → anglais) sur chaque page publique, Open Graph localisé, `sitemap.xml` avec les équivalents de langue, `robots.txt` excluant les espaces prospects, l’admin et l’API.
- **Textes** : `src/i18n/dictionaries/en.ts` (référence) et `fr.ts` (même structure, vérifiée par TypeScript). Les paramètres neutres (prix, durée de l’appel, identité juridique) sont dans `src/lib/content.ts`.
- **Réponses du diagnostic** : stockées sous forme de clés stables (`next_day`, `platforms`…), indépendantes de la langue ; le scoring dans `src/lib/diagnostic.ts` travaille sur ces clés et les libellés viennent du dictionnaire.
- **Langue du prospect** : colonne `locale` de la table `leads`. Espace, e-mails et synthèse PDF lui sont servis dans cette langue ; le pilotage l’affiche sur chaque fiche.

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

Projet déjà en place avant la version bilingue ? Exécutez une fois [`supabase/migrations/2026-10-16-locale.sql`](supabase/migrations/2026-10-16-locale.sql) : il ajoute la colonne `locale` (sans elle, l’enregistrement d’un diagnostic échoue).

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
| `NEXT_PUBLIC_SITE_URL` | oui | URL publique : e-mails, canoniques, hreflang, sitemap. À passer sur le domaine définitif dès qu’il est attaché |
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

3. Déployez. Testez le parcours complet dans les deux langues avec votre propre e-mail, puis supprimez les dossiers de test depuis `/admin`.

## Personnaliser

- **Textes (deux langues)** : [`src/i18n/dictionaries/en.ts`](src/i18n/dictionaries/en.ts) et [`fr.ts`](src/i18n/dictionaries/fr.ts)
- **Prix, durée de l’appel, identité juridique** : [`src/lib/content.ts`](src/lib/content.ts)
- **Questions, profils, règles de scoring** : [`src/lib/diagnostic.ts`](src/lib/diagnostic.ts) (voir [`docs/ANALYSE-DIAGNOSTIC.md`](docs/ANALYSE-DIAGNOSTIC.md))
- **Métiers reconnus (mots-clés FR/EN)** : [`src/lib/trades.ts`](src/lib/trades.ts)
- **E-mails** : [`src/lib/email.ts`](src/lib/email.ts) · **Synthèse PDF** : [`src/lib/pdf/synthese.tsx`](src/lib/pdf/synthese.tsx)
- **Logo** : [`src/components/LogoMark.tsx`](src/components/LogoMark.tsx) et [`src/app/icon.svg`](src/app/icon.svg)
- **Style** : [`src/app/globals.css`](src/app/globals.css)

## Suivi commercial

Les étapes du pipeline : Nouveau → Démo en préparation → Démo envoyée → Rendez-vous pris → Client signé (ou Perdu).

- Un nouveau diagnostic arrive en **Nouveau**. Un diagnostic refait avec le même e-mail met à jour le dossier existant sans doublon (et sa langue, si le prospect a changé de version).
- Collez l’URL de la démo dans la fiche : le dossier passe en **Démo envoyée**, le prospect reçoit l’e-mail « Votre démo est prête » dans sa langue et le lien apparaît dans son espace.
- Un rendez-vous (agenda intégré ou formulaire) passe le dossier en **Rendez-vous pris**.
- Le journal d’activité montre les ouvertures d’espace, les consultations de la démo et les téléchargements de synthèse.
- « La liste du matin » sur `/admin` propose la prochaine action pour chaque dossier actif. Le message de suivi suggéré est rédigé dans la langue du prospect.

## Démo d’origine

La maquette statique initiale (HTML/JS, localStorage, sous l’ancien nom « Carnet Plein ») est conservée dans [`legacy-demo/`](legacy-demo/) pour référence. Elle n’est plus utilisée.

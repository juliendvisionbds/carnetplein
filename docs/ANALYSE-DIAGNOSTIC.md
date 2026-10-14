# Analyse du diagnostic

Revue de la logique du diagnostic telle qu’elle existait dans la démo (`legacy-demo/app.js`, fonction `diagnose`), ce qui a été corrigé, et ce qui reste à décider.

## Ce qui est bon

- **Les dix questions sont bien choisies** : elles couvrent le flux (volume, sources, conversion), la prise de contact (délai, qualification, précision) et le suivi (devis, relance, outil). Trois minutes, pas de jargon, ton rassurant.
- **Les sept profils sont cohérents** avec l’offre : chaque profil a un titre, une explication, trois actions concrètes et une projection « demain ». Les textes sont prudents (pas de promesse chiffrée), ce qui crédibilise.
- **Le profil « acquisition »** qui dit honnêtement « notre offre ne résout pas le manque de demandes » est une bonne pratique commerciale : il filtre et rassure.
- **La variante « confirmation automatique déjà en place »** sur le profil « première réponse » montre que le diagnostic écoute vraiment.
- **Les preuves affichées** (« Votre suivi des devis : “Je relance quand j’y pense” ») relient le verdict aux réponses du prospect : c’est ce qui rend le résultat convaincant.

## Ce qui posait problème, et ce qui a été corrigé

| # | Problème | Correction appliquée |
|---|---|---|
| 1 | **La conversion n’était jamais utilisée.** La question « Sur 10 demandes, combien deviennent des clients ? » n’avait aucun effet sur le résultat. | « 0 à 1 » ajoute +1 à *relance* et *réponse* (les premiers suspects quand les demandes arrivent mais ne signent pas). « Je ne sais pas » ajoute +2 à *pilotage* : ne pas connaître son taux est un signal de visibilité. |
| 2 | **Les sources n’étaient jamais utilisées.** | Si les demandes viennent de plateformes ou de publicité et que la réponse n’est pas « en moins d’une heure », +1 à *réponse* : ces demandes sont partagées ou payées, elles refroidissent en heures. |
| 3 | **Moins de 5 demandes → « acquisition » quoi qu’il arrive.** Un cuisiniste haut de gamme avec 4 demandes/mois et aucune relance se faisait renvoyer vers « cherchez plus de demandes ». Mauvais pour lui, et un bon client perdu pour vous. | « Acquisition » seulement si le volume est faible **et** qu’aucun autre signal n’est fort (score ≤ 2). Sinon, le vrai blocage est affiché, avec la note « avec peu de demandes, chacune compte double ». |
| 4 | **Égalités arbitraires.** À scores égaux, l’ordre d’insertion décidait : *réponse* > *qualification* > *devis* > *relance* > *pilotage*. « Je relance quand j’y pense » (4) perdait contre « seulement le nom et le téléphone » (4). | Ordre de départage explicite, de la perte la plus directe à la moins directe : *relance* > *réponse* > *qualification* > *pilotage* > *devis*. |
| 5 | **Un seul verdict, même quand deux signaux sont forts.** Quelqu’un qui répond après plusieurs jours **et** ne relance jamais ne voyait qu’une des deux fuites. | Un **signal secondaire** est affiché (« À surveiller aussi : première réponse ») dès que le deuxième score ≥ 3. Il est aussi enregistré dans le dossier pour préparer la démo. |
| 6 | **Aucune notion d’intensité.** Un score de 2 et un score de 5 donnaient le même affichage. | Une intensité (*forte* ≥ 4, *modérée* 2–3, *faible*) est calculée, affichée au prospect et dans le back-office. Utile pour prioriser vos relances. |
| 7 | **« Je ne sais pas » sur le volume n’avait aucun effet.** | +1 à *pilotage*. |
| 8 | **Le simulateur partait de 20 demandes / 20 % quelle que soit la réponse.** | Il est prérempli à partir du volume et de la conversion déclarés (milieu de fourchette). |
| 9 | **Le métier en texte libre** ne correspondait jamais aux aperçus métier (« cuisiniste » ≠ « Cuisines & agencement »), donc l’aperçu était presque toujours générique. | **Question retirée** (demande de Julien). Le métier est détecté à partir du site renseigné (titre, description, h1, mots-clés) dans `src/lib/site-info.ts`, parmi 14 métiers définis dans `src/lib/trades.ts`, et reste modifiable dans la fiche du pilotage. Neuf questions au lieu de dix. |
| 10 | **Le texte d’accueil promettait « sans laisser d’e-mail »**, contradictoire avec la capture des coordonnées. | Remplacé par « 3 minutes · Gratuit · Résultat immédiat ». |

Le détail des règles est dans [`src/lib/diagnostic.ts`](../src/lib/diagnostic.ts), fonctions `scoreAnswers` et `diagnose`. Elles sont pures et faciles à ajuster.

## Grille de scores actuelle

| Signal | Réponse | Points |
|---|---|---|
| Réponse | après plusieurs jours / le lendemain / ça dépend | 5 / 3 / 1 |
| Réponse | sources plateformes ou publicité **et** réponse pas sous l’heure | +1 |
| Réponse, Relance | conversion « 0 à 1 » | +1 chacun |
| Qualification | nom et téléphone seulement / informations incomplètes | 4 / 2 |
| Devis | devis retardés faute de temps / plusieurs échanges | 4 / 2 |
| Relance | je ne relance pas / quand j’y pense / une relance puis rien | 5 / 4 / 3 |
| Pilotage | suivi dans ma tête / e-mails et carnet / je ne sais pas | 4 / 3 / 1 |
| Pilotage | je cherche dans mes messages ou je garde en tête | +2 |
| Pilotage | volume inconnu / conversion inconnue | +1 / +2 |

Cas particuliers : volume < 5 et meilleur score ≤ 2 → *acquisition* ; tous les scores à 0 → *optimisation* (ou *pilotage* si au moins trois « je ne sais pas »).

## À décider de votre côté

1. **Le profil « optimisation »** (parcours déjà structuré) est honnête mais peu vendeur. Vous pouvez décider de quand même proposer la démo comme « second regard », ou d’assumer de ne pas pousser. Le texte est dans `profiles.optimisation`.
2. **Le prix affiché avant l’appel** (970 € HT + 490 € HT/mois) qualifie fort. C’est un choix : il réduit les rendez-vous curieux, mais aussi les occasions de convaincre. Modifiable dans `src/lib/content.ts`, ou retirable de l’espace prospect en quelques lignes.
3. **Le délai annoncé pour la démo** est « sous 2 à 3 jours ouvrés » (`DEMO_DELAY`). Tenez-le ou ajustez-le : c’est la première promesse que le prospect vérifie.
4. **Les poids** ci-dessus restent une opinion de départ. Après 30 à 50 diagnostics, comparez les priorités attribuées aux rendez-vous réellement pris et ajustez.

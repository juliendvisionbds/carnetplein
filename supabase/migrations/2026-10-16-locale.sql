-- Vision — version bilingue (16 octobre 2026)
-- À exécuter une fois dans l’éditeur SQL du projet Supabase existant (Dashboard → SQL Editor).
-- Ajoute la langue du prospect ; les dossiers existants sont considérés français.

alter table public.leads
  add column if not exists locale text not null default 'fr' check (locale in ('en', 'fr'));

-- Les réponses du diagnostic sont désormais stockées sous forme de clés stables (ex. « next_day »)
-- au lieu des libellés français. Les anciens dossiers restent lisibles : les libellés d’origine
-- sont affichés tels quels dans le pilotage.

-- Carnet Plein — schéma Supabase
-- À exécuter une fois dans l’éditeur SQL de votre projet Supabase (Dashboard → SQL Editor).

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  token         text not null unique,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  name          text not null,
  email         text not null,
  company       text,
  website       text not null,
  phone         text,
  context       text,
  trade         text,          -- détecté depuis le site, modifiable dans le pilotage
  site_title    text,
  site_description text,
  answers       jsonb not null default '{}'::jsonb,
  priority      text not null,
  secondary     text,
  intensity     text not null default 'modérée',
  stage         smallint not null default 0 check (stage between 0 and 5), -- 0 Nouveau · 1 Démo en préparation · 2 Démo envoyée · 3 RDV pris · 4 Client signé · 5 Perdu
  demo_url      text,
  booking       jsonb,
  utm           jsonb,
  consent_at    timestamptz not null default now(),
  last_seen_at  timestamptz
);

create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_stage_idx on public.leads (stage);
create index if not exists leads_created_idx on public.leads (created_at desc);

create table if not exists public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);
create index if not exists lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

create table if not exists public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at desc);

-- Sécurité : RLS activé, aucune policy publique.
-- L’application n’accède à ces tables qu’avec la clé « service role », côté serveur.
alter table public.leads       enable row level security;
alter table public.lead_notes  enable row level security;
alter table public.lead_events enable row level security;

revoke all on public.leads, public.lead_notes, public.lead_events from anon, authenticated;

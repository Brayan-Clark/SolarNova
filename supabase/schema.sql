-- ============================================================
--  SolarNova — Script d'installation de la base Supabase
-- ============================================================
--  À COLLER EN UNE SEULE FOIS dans Supabase → SQL Editor → Run.
--  Crée les 3 tables + active la sécurité (RLS) + les règles d'accès.
--  Le script est ré-exécutable sans risque (idempotent).
-- ------------------------------------------------------------

-- 1) TABLES -------------------------------------------------

-- Avis clients
create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  name        text not null,
  solution    text not null,
  rating      int  not null check (rating between 1 and 5),
  comment     text not null,
  approved    boolean not null default false, -- modération : faux par défaut
  created_at  timestamptz not null default now()
);

-- (Si la table existait déjà sans la colonne, on l'ajoute)
alter table public.reviews
  add column if not exists approved boolean not null default false;

-- Messages de contact / demandes de devis
create table if not exists public.contacts (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  phone       text,
  subject     text not null,
  message     text not null,
  created_at  timestamptz not null default now()
);

-- Articles de blog (gérés depuis l'admin)
create table if not exists public.articles (
  id          bigint generated always as identity primary key,
  category    text,
  date        text,
  "readTime"  text,
  image       text,
  title       text not null,
  excerpt     text,
  content     text,
  created_at  timestamptz not null default now()
);

-- Solutions / kits (gérés depuis l'admin)
create table if not exists public.solutions (
  id            bigint generated always as identity primary key,
  name          text not null,
  tier          text,
  subtitle      text,
  "maxWatts"    int,
  "maxDailyWh"  int,
  components     jsonb,
  "priceRange"  text,
  icon          text,
  color         text,
  created_at    timestamptz not null default now()
);

-- Devis générés par le calculateur
create table if not exists public.quotes (
  id                bigint generated always as identity primary key,
  appliances        jsonb not null,
  total_peak_watts  int,
  total_daily_wh    int,
  total_monthly_kwh int,
  suggested_kit     text,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  created_at        timestamptz not null default now()
);

-- 2) SÉCURITÉ (RLS) -----------------------------------------
alter table public.reviews   enable row level security;
alter table public.contacts  enable row level security;
alter table public.quotes    enable row level security;
alter table public.articles  enable row level security;
alter table public.solutions enable row level security;

-- 3) RÈGLES D'ACCÈS -----------------------------------------
-- (on supprime d'abord pour pouvoir relancer le script sans erreur)

-- Avis : lecture publique LIMITÉE aux avis approuvés + ajout public
-- (un avis posté reste invisible tant que tu ne l'as pas validé)
drop policy if exists "reviews_read"   on public.reviews;
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_read"   on public.reviews for select using (approved = true);
create policy "reviews_insert" on public.reviews for insert with check (true);

-- Contacts : ajout public uniquement (PAS de lecture publique → leads protégés)
drop policy if exists "contacts_insert" on public.contacts;
create policy "contacts_insert" on public.contacts for insert with check (true);

-- Devis : ajout public uniquement
drop policy if exists "quotes_insert" on public.quotes;
create policy "quotes_insert" on public.quotes for insert with check (true);

-- ============================================================
-- 4) RÔLES & PERMISSIONS (RBAC)
-- ============================================================

-- Rôles applicatifs
create table if not exists public.app_roles (
  id          bigint generated always as identity primary key,
  name        text unique not null,
  label       text not null,
  permissions jsonb not null default '[]'::jsonb,
  system      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Attribution rôle ↔ utilisateur (par email ; user_id rempli au besoin)
create table if not exists public.app_user_roles (
  id          bigint generated always as identity primary key,
  email       text unique not null,
  user_id     uuid,
  role_name   text not null references public.app_roles(name),
  created_at  timestamptz not null default now()
);

-- Rôles système par défaut (super_admin = toutes les permissions via "*")
insert into public.app_roles (name, label, permissions, system) values
  ('super_admin', 'Super administrateur', '["*"]'::jsonb, true),
  ('admin', 'Administrateur',
   '["articles.manage","solutions.manage","reviews.moderate","leads.view"]'::jsonb, true)
on conflict (name) do nothing;

-- Vérifie si l'utilisateur courant possède une permission donnée.
-- "security definer" : la fonction lit les tables en ignorant le RLS.
create or replace function public.has_permission(perm text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_user_roles ur
    join public.app_roles r on r.name = ur.role_name
    where (ur.user_id = auth.uid() or ur.email = (auth.jwt() ->> 'email'))
      and (r.permissions ? '*' or r.permissions ? perm)
  );
$$;

-- 1er utilisateur = super admin : n'agit que si AUCUN super_admin n'existe.
create or replace function public.claim_super_admin()
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.app_user_roles where role_name = 'super_admin') then
    insert into public.app_user_roles (email, user_id, role_name)
    values (coalesce(auth.jwt() ->> 'email', auth.uid()::text), auth.uid(), 'super_admin')
    on conflict (email) do update
      set user_id = excluded.user_id, role_name = 'super_admin';
  end if;
end;
$$;

grant execute on function public.claim_super_admin() to authenticated;
grant execute on function public.has_permission(text) to authenticated;

-- RLS des tables RBAC
alter table public.app_roles      enable row level security;
alter table public.app_user_roles enable row level security;

-- Rôles : lisibles par tout connecté ; gérés par "roles.manage"
drop policy if exists "roles_read"  on public.app_roles;
drop policy if exists "roles_admin" on public.app_roles;
create policy "roles_read"  on public.app_roles for select to authenticated using (true);
create policy "roles_admin" on public.app_roles for all to authenticated
  using (has_permission('roles.manage')) with check (has_permission('roles.manage'));

-- Attributions : chacun lit la sienne ; "users.manage" gère tout
drop policy if exists "user_roles_read"  on public.app_user_roles;
drop policy if exists "user_roles_admin" on public.app_user_roles;
create policy "user_roles_read" on public.app_user_roles for select to authenticated
  using (has_permission('users.manage') or user_id = auth.uid()
         or email = (auth.jwt() ->> 'email'));
create policy "user_roles_admin" on public.app_user_roles for all to authenticated
  using (has_permission('users.manage')) with check (has_permission('users.manage'));

-- ============================================================
-- 5) ACCÈS AU CONTENU selon les permissions
-- ============================================================

-- Avis : modération réservée à "reviews.moderate"
drop policy if exists "reviews_admin_read"   on public.reviews;
drop policy if exists "reviews_admin_update" on public.reviews;
drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_read"   on public.reviews for select to authenticated using (has_permission('reviews.moderate'));
create policy "reviews_admin_update" on public.reviews for update to authenticated using (has_permission('reviews.moderate')) with check (has_permission('reviews.moderate'));
create policy "reviews_admin_delete" on public.reviews for delete to authenticated using (has_permission('reviews.moderate'));

-- Articles : lecture publique + gestion "articles.manage"
drop policy if exists "articles_read"  on public.articles;
drop policy if exists "articles_admin" on public.articles;
create policy "articles_read"  on public.articles for select using (true);
create policy "articles_admin" on public.articles for all to authenticated
  using (has_permission('articles.manage')) with check (has_permission('articles.manage'));

-- Solutions : lecture publique + gestion "solutions.manage"
drop policy if exists "solutions_read"  on public.solutions;
drop policy if exists "solutions_admin" on public.solutions;
create policy "solutions_read"  on public.solutions for select using (true);
create policy "solutions_admin" on public.solutions for all to authenticated
  using (has_permission('solutions.manage')) with check (has_permission('solutions.manage'));

-- Demandes (contacts / devis) : lecture réservée à "leads.view"
drop policy if exists "contacts_admin_read" on public.contacts;
drop policy if exists "quotes_admin_read"   on public.quotes;
create policy "contacts_admin_read" on public.contacts for select to authenticated using (has_permission('leads.view'));
create policy "quotes_admin_read"   on public.quotes   for select to authenticated using (has_permission('leads.view'));

-- ✅ Terminé. Site public + back-office (/admin) + rôles/permissions opérationnels.
-- Le 1er utilisateur qui se connecte à /admin devient super administrateur.

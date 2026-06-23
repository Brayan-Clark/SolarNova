# SolarNova ☀️

Site vitrine + calculateur d'énergie solaire, réécrit avec **Astro**, **Tailwind CSS** et **Alpine.js**, avec une intégration **Supabase** optionnelle.

> Le style, les couleurs et les animations de la version d'origine ont été conservés à l'identique. L'ancienne version mono-fichier reste disponible dans `legacy/index.html`.

---

## 🚀 Démarrage

```bash
npm install      # installe les dépendances
npm run dev      # serveur de développement → http://localhost:4321
npm run build    # build de production dans dist/
npm run preview  # prévisualise le build de production
```

L'application **fonctionne immédiatement, sans base de données**. Tant que Supabase n'est pas configuré :

- les **avis** affichés sont ceux par défaut (données locales) ;
- publier un avis, envoyer un message de contact ou demander un devis affiche un **message d'information** (« Base de données non connectée… ») — **sans jamais planter**.

---

## 🗂️ Structure du projet

```
src/
├── layouts/
│   └── Layout.astro            # <head>, polices, scope Alpine, bundle JS
├── pages/
│   └── index.astro             # assemble tous les composants
├── components/
│   ├── Preloader.astro
│   ├── Particles.astro
│   ├── Nav.astro               # navigation + menu mobile
│   ├── Footer.astro
│   ├── Toast.astro
│   └── main/                   # une page = un composant
│       ├── HomePage.astro
│       ├── SolutionsPage.astro
│       ├── CalculateurPage.astro
│       ├── BlogPage.astro
│       ├── AvisPage.astro
│       ├── AproposPage.astro
│       └── ContactPage.astro
├── scripts/
│   └── app.js                  # toute la logique Alpine (createApp)
├── lib/
│   ├── supabase.js             # client Supabase tolérant à l'absence de clés
│   └── db.js                   # fetchReviews / insertReview / insertContact / insertQuote
└── styles/
    └── global.css              # directives Tailwind + styles custom d'origine
```

---

## 🔌 Connexion à Supabase (à faire pour activer la base)

> 🟢 **Pas développeur ?** Suis plutôt le guide pas-à-pas illustré :
> **[GUIDE-SUPABASE.md](GUIDE-SUPABASE.md)**. Les tables se créent en
> **un seul copier-coller** du fichier [`supabase/schema.sql`](supabase/schema.sql)
> (l'appli ne les crée pas automatiquement — c'est une sécurité Supabase).

### 1. Créer un projet Supabase
1. Aller sur [supabase.com](https://supabase.com) → **New project**.
2. Une fois le projet créé, ouvrir **Project Settings → API**.
3. Récupérer :
   - **Project URL** (ex. `https://xxxx.supabase.co`)
   - **anon public key**

### 2. Renseigner les variables d'environnement
Copier `.env.example` en `.env` à la racine, puis remplir :

```dotenv
PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi....
```

> Le préfixe `PUBLIC_` est **obligatoire** : il expose la variable au navigateur (Astro/Vite). La clé `anon` est conçue pour être publique ; la sécurité repose sur les politiques RLS (ci-dessous).

Redémarrer `npm run dev` après modification du `.env`.

### 3. Créer les tables (SQL)
Dans Supabase → **SQL Editor**, exécuter :

```sql
-- Avis clients
create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  name        text not null,
  solution    text not null,
  rating      int  not null check (rating between 1 and 5),
  comment     text not null,
  created_at  timestamptz not null default now()
);

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
```

### 4. Politiques de sécurité (RLS)
Active RLS et autorise ce dont le site public a besoin :

```sql
alter table public.reviews  enable row level security;
alter table public.contacts enable row level security;
alter table public.quotes   enable row level security;

-- Avis : lecture publique + insertion publique
create policy "reviews_read"   on public.reviews  for select using (true);
create policy "reviews_insert" on public.reviews  for insert with check (true);

-- Contacts & devis : insertion publique uniquement (pas de lecture publique)
create policy "contacts_insert" on public.contacts for insert with check (true);
create policy "quotes_insert"   on public.quotes   for insert with check (true);
```

> ⚠️ Les politiques ci-dessus conviennent à un site vitrine. Pour la **modération des avis**, envisage une colonne `approved boolean default false` et une lecture filtrée (`using (approved = true)`), la validation se faisant depuis le back-office Supabase.

---

## 🌐 Déploiement sur GitHub Pages (avec Supabase)

GitHub Pages est un hébergement **100 % statique** : pas de serveur, donc pas de `.env` lu à l'exécution. Ce n'est **pas un problème** pour Supabase :

> 🔑 **La clé `anon` est faite pour être publique.** Elle est conçue pour vivre dans le code côté navigateur. La sécurité **ne repose pas** sur le secret de cette clé, mais sur les **politiques RLS** (voir plus haut). On évite simplement de l'écrire en dur dans le code source en l'injectant au build via les **GitHub Secrets**.

### 1. Activer Pages
Dépôt → **Settings → Pages → Build and deployment → Source : GitHub Actions**.

### 2. Déclarer les clés et l'URL
Dépôt → **Settings → Secrets and variables → Actions** :

| Type | Nom | Valeur |
|------|-----|--------|
| **Secret** | `PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| **Secret** | `PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi…` |
| **Variable** | `SITE` | `https://<utilisateur>.github.io` |
| **Variable** | `BASE` | `/<nom-du-depot>` (ex. `/SolarNova`) |

> `BASE` n'est nécessaire que pour une page **« projet »** (`…github.io/SolarNova/`). Pour un **domaine personnalisé** ou une page **« utilisateur »** (`<utilisateur>.github.io`), laisse `BASE` vide.

### 3. Pousser sur `main`
Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) build le site (en injectant les clés) et le publie automatiquement.

### 🔒 Sécurité côté Supabase — l'essentiel
Comme la clé `anon` est publique, **tout repose sur le RLS** :

- `contacts` et `quotes` : **insertion seule**, pas de lecture publique → personne ne peut récupérer tes leads via la clé `anon`.
- `reviews` : lecture + insertion publiques (et idéalement une colonne `approved` pour modérer).
- L'insertion étant ouverte au public, une protection anti-spam est en place : voir la section **Anti-bot** ci-dessous.

> ⚠️ Ne mets **jamais** la clé `service_role` dans le front : celle-là contourne le RLS. Seule la clé `anon` doit être utilisée côté navigateur.

---

## 🛡️ Anti-bot (Cloudflare Turnstile)

Les formulaires **Contact** et **Avis** intègrent un anti-bot **Cloudflare Turnstile** (gratuit, sans casse-tête RGPD comme reCAPTCHA). Tout est **optionnel** : sans clé, aucun widget n'apparaît et les formulaires fonctionnent normalement.

### Deux niveaux possibles

**Niveau 1 — widget seul (rapide, 100 % statique)**
Le widget s'affiche et bloque l'envoi tant que le test n'est pas validé. Suffisant contre les bots basiques.

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Turnstile** → créer un widget (ajouter ton domaine GitHub Pages + `localhost` pour les tests).
2. Renseigner la **clé de site** (publique) :
   ```dotenv
   PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   ```
   (En production GitHub Pages : ajouter ce secret dans le workflow, comme les clés Supabase.)

**Niveau 2 — vérification serveur (recommandé en prod)**
Pour une protection réelle, le token doit être **vérifié côté serveur**. Comme GitHub Pages n'a pas de serveur, on utilise une **Edge Function Supabase** ([`supabase/functions/submit`](supabase/functions/submit/index.ts)) qui :
1. vérifie le token Turnstile auprès de Cloudflare ;
2. écrit en base via la clé `service_role` (donc le RLS peut **interdire** toute écriture directe par la clé `anon`).

Déploiement :
```bash
# Lier le projet puis déployer la fonction
supabase link --project-ref <ref>
supabase functions deploy submit --no-verify-jwt
# Secret de vérification (clé SECRÈTE Turnstile)
supabase secrets set TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```
Puis pointer le front vers la fonction :
```dotenv
PUBLIC_SUBMIT_ENDPOINT=https://<ref>.supabase.co/functions/v1/submit
```
Quand `PUBLIC_SUBMIT_ENDPOINT` est défini, **toutes** les écritures passent par la fonction. Tu peux alors durcir le RLS en retirant les policies d'`insert` publiques :
```sql
drop policy if exists "reviews_insert"  on public.reviews;
drop policy if exists "contacts_insert" on public.contacts;
drop policy if exists "quotes_insert"   on public.quotes;
-- (la clé service_role utilisée par l'Edge Function ignore le RLS)
```

> Récap : **clé de site** = publique (front) ; **clé secrète** = uniquement dans les secrets Supabase, jamais dans le front.

---

## 🔐 Back-office d'administration (`/admin`)

Une page d'administration permet de gérer le contenu sans toucher au code :
**articles de blog** (créer/modifier/supprimer), **solutions/kits**, **modération
des avis**, et consultation des **demandes** (contacts + devis).

➡️ Accès : `http://localhost:4321/admin` (ou `…/admin` en ligne).

### Deux modes d'authentification (automatiques)

| Situation | Connexion | Stockage des modifications |
|-----------|-----------|----------------------------|
| **Local** (Supabase non configuré) | identifiant de **développement** : `admin` / `solarnova` | `localStorage` du navigateur (démo) |
| **Production** (Supabase configuré) | **lien magique par email** (passwordless) | base Supabase (réel, partagé) |

> 🔒 L'accès de développement est **volontairement inutilisable en production** :
> dès que les clés Supabase sont présentes, seul le lien magique fonctionne.
> (Identifiants de dev modifiables dans `src/lib/auth.js`.)

### Configurer le lien magique (indispensable)
Supabase → **Authentication → URL Configuration** :
- **Site URL** : `https://<utilisateur>.github.io/<dépôt>/admin`
- **Redirect URLs** : la même URL + `http://localhost:4321/admin` (pour les tests).

> 📧 L'envoi d'emails intégré de Supabase est **plafonné** (quelques mails/heure
> sur le plan gratuit). Pour la production, configure un **SMTP** (Authentication
> → Emails) — ex. Resend, Brevo.

### Créer le 1er super admin
1. (Recommandé) Supabase → **Authentication → Users → Add user** : ajoute ton email (« Auto Confirm »).
2. Va sur `…/admin`, entre cet email → reçois le lien → connecte-toi.
3. Au 1er login, tu deviens **super administrateur** automatiquement.

> Les droits sont appliqués **côté base** par le RLS (`has_permission()`), pas
> seulement dans l'interface : un compte sans rôle ne peut rien faire.

Le site public lit son contenu via la même couche (`src/lib/content.js`) : ce que
tu changes dans l'admin apparaît directement sur le site.

### Rôles & permissions (RBAC)

Le back-office gère des **rôles** et des **permissions** (onglets *Rôles & accès*
et *Utilisateurs*, visibles selon tes droits) :

- **Le 1er utilisateur qui se connecte devient automatiquement *super administrateur*** (toutes les permissions). En local, l'utilisateur de dev est super admin d'office.
- Le **super admin** peut créer des **rôles personnalisés** et leur cocher des permissions, puis **attribuer un rôle à un utilisateur** (par email).
- Permissions disponibles : `articles.manage`, `solutions.manage`, `reviews.moderate`, `leads.view`, `roles.manage`, `users.manage`.
- Rôles système (non supprimables) : **Super administrateur** (`*`) et **Administrateur** (contenu + modération + demandes).

**Sécurité réelle (pas seulement l'interface)** : les droits sont aussi appliqués
**côté base** par le RLS. Le `schema.sql` crée une fonction `has_permission()` et
une RPC `claim_super_admin()`, et les politiques d'écriture vérifient la permission
correspondante. Un utilisateur connecté **sans rôle** ne peut donc rien faire,
même en contournant l'interface.

> Flux en production : applique `schema.sql` → ajoute ton email dans Supabase Auth
> → connecte-toi à `/admin` par lien magique (tu deviens super admin) → **invite**
> ton équipe par email depuis l'onglet *Utilisateurs*.

### Inviter des utilisateurs (depuis l'admin)

Il n'existe **pas de page publique d'inscription** (volontaire). Le super admin
(ou un utilisateur ayant `users.manage`) **invite** depuis l'onglet *Utilisateurs* :
il saisit **email + rôle**. La personne va sur `/admin`, entre son email, reçoit
le **lien magique** et se connecte — elle hérite du rôle attribué.

- **Aucun mot de passe**, **rien à déployer** : l'invitation = une simple
  attribution de rôle (`app_user_roles`), et la connexion passe par le lien magique.
- On ne peut pas retirer/rétrograder le **dernier** super administrateur (anti-verrouillage).

> 💡 Une Edge Function optionnelle [`admin-users`](supabase/functions/admin-users/index.ts)
> existe si tu veux un jour créer des comptes **email + mot de passe** (elle
> nécessite `supabase functions deploy admin-users`). Non requise pour le lien magique.

---

## ✉️ Notifications par email (Resend)

Pour **recevoir un email** à chaque demande de contact ou devis (au lieu de surveiller le Table Editor), l'Edge Function envoie une notification via **[Resend](https://resend.com)**. C'est **optionnel** : sans configuration, rien n'est envoyé et l'enregistrement en base fonctionne quand même.

> 🔐 La clé d'envoi d'email est **secrète** : elle ne peut pas vivre dans un site statique. Elle reste donc dans l'Edge Function (secrets Supabase), jamais dans le front.

### Mise en place
1. Crée un compte sur [resend.com](https://resend.com) et **vérifie ton domaine d'envoi** (ou utilise le domaine de test pour commencer).
2. Récupère ta **clé API** (`re_...`).
3. Définis les secrets de l'Edge Function :
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set NOTIFY_TO=toi@solarnova.ml
   supabase secrets set NOTIFY_FROM=site@tondomaine.com   # expéditeur vérifié
   supabase functions deploy submit --no-verify-jwt
   ```

C'est tout : chaque nouveau message de contact / devis déclenche un email récapitulatif. (L'envoi est *best-effort* : s'il échoue, l'enregistrement en base reste OK.)

---

## ✅ Ce qui a été corrigé / ajouté

- **Bug calculateur → contact** : les appareils sélectionnés et le kit recommandé sont désormais **transmis et pré-remplis** dans le formulaire de contact (méthode `requestQuote()`). Idem pour le bouton « Demander un devis » des cartes Solutions (`requestSolution()`).
- **Migration Astro** : un seul fichier HTML découpé en composants réutilisables, prêt à évoluer.
- **Tailwind en build** (plus de CDN) : mêmes couleurs (`sol`, `gold`) et polices (`Outfit`, `Space Grotesk`).
- **Supabase optionnel** : avis, contacts et devis persistés quand la base est connectée, comportement local sinon.
- **Performance** : `@supabase/supabase-js` est chargé **à la demande** (import dynamique) → bundle initial réduit de ~80 Ko à ~27 Ko (gzip). Animation des particules **mise en pause** quand l'onglet est masqué. Images en `loading="lazy"`.
- **SEO** : meta description, **Open Graph + Twitter Card**, favicon, `theme-color`, URL canonique, `robots.txt` et `sitemap.xml` (généré au build si `SITE` est défini).
- **Modération des avis** : un avis posté reste **invisible tant qu'il n'est pas approuvé** (colonne `approved`). Pour le valider : Supabase → **Table Editor** → `reviews` → passe `approved` à `true`.
- **Email** : notification Resend optionnelle à chaque demande de contact / devis.

---

## 🛠️ Stack

| Outil | Rôle |
|-------|------|
| Astro | Framework / build statique |
| Tailwind CSS | Styles utilitaires |
| Alpine.js | Interactivité (SPA légère) |
| Supabase | Base de données (optionnelle) |
| Font Awesome | Icônes (CDN) |

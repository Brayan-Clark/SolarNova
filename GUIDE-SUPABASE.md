# 📘 Guide : connecter SolarNova à Supabase (pas à pas)

> Ce guide est fait pour **tout le monde**, même sans connaissances techniques.
> Tu vas juste **copier-coller** quelques valeurs. Compte environ **15 minutes**.

## ❓ La question la plus importante d'abord

**« Quand je connecte Supabase, est-ce que l'appli crée les tables toute seule ? »**

➡️ **Non.** Pour des raisons de sécurité, une application web n'a pas le droit de
créer des tables. **Mais c'est très simple** : tu vas coller **un seul script**
(préparé pour toi) qui crée tout en un clic. C'est l'**étape 4** ci-dessous.

> 💡 Sans Supabase, le site **fonctionne déjà** : il affiche des avis d'exemple
> et les formulaires montrent juste un petit message. Supabase sert à
> **enregistrer pour de vrai** les avis, les messages de contact et les devis.

---

## Étape 1 — Créer un compte Supabase (gratuit)

1. Va sur **https://supabase.com**
2. Clique sur **Start your project** et crée un compte (ou connecte-toi avec GitHub/Google).

## Étape 2 — Créer un projet

1. Clique sur **New project**.
2. Remplis :
   - **Name** : `solarnova` (ou ce que tu veux)
   - **Database Password** : clique sur **Generate a password** et **garde-le quelque part** (tu n'en auras pas besoin pour le site, mais c'est utile à conserver).
   - **Region** : choisis la plus proche de tes visiteurs (ex. *West EU (Paris)*).
3. Clique sur **Create new project** puis patiente ~1 minute (le temps que ça démarre).

## Étape 3 — Récupérer tes 2 clés

1. Dans le menu de gauche, en bas, clique sur ⚙️ **Project Settings**.
2. Clique sur **API**.
3. Note ces **deux valeurs** (tu les colleras à l'étape 5) :

   | Sur la page Supabase | Ce que c'est |
   |----------------------|--------------|
   | **Project URL** | l'adresse de ta base (ex. `https://abcd1234.supabase.co`) |
   | **anon public** (sous *Project API keys*) | la clé publique (longue, commence par `eyJ...`) |

   > 🔒 **Important** : prends bien la clé **`anon` / `public`**, JAMAIS la clé
   > `service_role` (celle-là est secrète et ne doit jamais aller sur le site).

## Étape 4 — Créer les tables (le fameux copier-coller 🪄)

1. Dans le menu de gauche, clique sur **SQL Editor**.
2. Clique sur **+ New query**.
3. Ouvre le fichier **`supabase/schema.sql`** de ce projet, **copie tout son contenu**
   et **colle-le** dans l'éditeur.
4. Clique sur **Run** (ou `Ctrl/Cmd + Entrée`).

✅ C'est fait : les tables `reviews`, `contacts`, `quotes` existent et sont sécurisées.
Tu n'auras **plus jamais** à refaire cette étape.

## Étape 5 — Brancher le site sur la base

### En local (sur ton ordinateur)

1. À la racine du projet, **duplique** le fichier `.env.example` et renomme la copie **`.env`**.
2. Ouvre `.env` et colle tes 2 valeurs de l'étape 3 :
   ```dotenv
   PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...(ta longue clé)
   ```
3. (Re)lance le site :
   ```bash
   npm run dev
   ```

### En ligne (sur GitHub Pages)

Le fichier `.env` **n'est pas** envoyé sur GitHub (c'est normal et voulu). On range
les clés dans les **GitHub Secrets** :

1. Sur ton dépôt GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Onglet **Secrets** → **New repository secret**, crée :
   - `PUBLIC_SUPABASE_URL` → ton URL
   - `PUBLIC_SUPABASE_ANON_KEY` → ta clé anon
3. Onglet **Variables** → **New repository variable**, crée :
   - `SITE` → `https://TON-PSEUDO.github.io`
   - `BASE` → `/NOM-DU-DEPOT` (ex. `/SolarNova`) — *à laisser vide si domaine perso*

À chaque envoi de code sur la branche `main`, le site se reconstruit et se publie tout seul.

## Étape 6 — Vérifier que ça marche ✅

1. Ouvre le site, va sur **Avis**, publie un avis de test.
2. Retourne dans Supabase → menu **Table Editor** → table **reviews** :
   ton avis doit apparaître. 🎉
3. Teste aussi le formulaire **Contact** → il apparaîtra dans la table **contacts**.

## Étape 7 — Valider (modérer) les avis 📝

Pour éviter le spam, **un avis posté n'apparaît PAS automatiquement** sur le site :
tu dois l'approuver.

1. Supabase → **Table Editor** → table **reviews**.
2. Trouve l'avis, double-clique sur la colonne **approved** et passe-la à **true**.
3. L'avis devient visible sur le site. ✅

> 💡 Tant que `approved` est `false`, le visiteur ne voit pas l'avis (mais celui
> qui l'a posté voit un message « sera publié après validation »).

---

## 🛡️ (Optionnel) Bloquer les robots / le spam

Quand le site reçoit du trafic, tu peux activer l'anti-bot **Cloudflare Turnstile**.
C'est **facultatif** et expliqué dans le **README** (section *Anti-bot*). En résumé :

- **Simple** : crée une clé sur Cloudflare Turnstile et ajoute `PUBLIC_TURNSTILE_SITE_KEY`.
  Un petit test « je ne suis pas un robot » apparaît sur les formulaires.
- **Avancé** (vérification serveur) : déploie l'Edge Function fournie. Détails dans le README.

## 🔐 La page d'administration (`/admin`)

Tu disposes d'un espace de gestion à l'adresse **`/admin`** (ex. `tonsite.com/admin`)
pour gérer **articles, solutions, avis et demandes**.

- **En local (sans Supabase)** : connecte-toi avec l'identifiant **`admin`** et le
  mot de passe **`solarnova`**. Les modifications sont gardées dans ton navigateur
  (mode démo). ⚠️ Cet accès **ne marche pas** en production.
- **En production (avec Supabase)** : il faut un **vrai compte**. Crée-le dans
  Supabase → **Authentication** → **Users** → **Add user** (email + mot de passe),
  puis connecte-toi sur `/admin` avec ce compte.

> 💡 Pense aussi à valider les avis depuis `/admin` (onglet **Avis**) — c'est
> l'équivalent simplifié de l'étape 7.

### Rôles & droits d'accès

- **La première personne qui se connecte à `/admin` devient automatiquement
  super administrateur** (elle a tous les droits).
- Le super admin peut ensuite, dans les onglets **Rôles & accès** et
  **Utilisateurs** :
  1. créer des rôles (ex. « Éditeur ») et cocher leurs permissions ;
  2. attribuer un rôle à une personne **par son email**.
- Une personne qui se connecte **sans rôle attribué** voit « Accès non attribué »
  et ne peut rien faire.

👉 En pratique : crée d'abord ton compte (Authentication → Users), connecte-toi
(tu deviens super admin), puis crée les comptes de ton équipe.

### Comment les autres obtiennent-ils un identifiant ?

Il n'y a **pas de page d'inscription** : c'est **toi (admin) qui crées les
comptes**. Dans `/admin` → onglet **Utilisateurs** → « Créer un compte » : tu
saisis **email + mot de passe + rôle**, et tu communiques ces identifiants à la
personne. Elle se connecte ensuite sur `/admin` avec cet email et ce mot de passe.

> ⚙️ Pour que ça marche en production, déploie une fois la fonction qui crée les
> comptes :
> ```bash
> supabase functions deploy admin-users
> ```
> (Le premier compte, lui, se crée à la main dans Supabase → Authentication →
> Users, puisqu'il n'y a pas encore d'admin pour le créer.)

## ✉️ (Optionnel) Recevoir un email à chaque demande

Plutôt que d'aller voir le Table Editor, tu peux **recevoir un email** automatique à
chaque contact / devis. Ça utilise un service gratuit (**Resend**) et l'Edge Function.
Toutes les étapes sont dans le **README** (section *Notifications par email*).

---

## 🆘 Petit dépannage

| Problème | Solution |
|----------|----------|
| Les avis publiés ne s'enregistrent pas | Vérifie que le script de l'**étape 4** a bien été exécuté (table visible dans *Table Editor*). |
| Message « Base de données non connectée » | Les clés de l'**étape 5** sont absentes ou mal collées. Vérifie le `.env` (ou les Secrets GitHub) et relance. |
| En local, rien ne change après modif du `.env` | **Arrête puis relance** `npm run dev` (le `.env` n'est lu qu'au démarrage). |
| « Invalid API key » | Tu as probablement pris la mauvaise clé : reprends bien la clé **`anon` / `public`**. |

> Besoin d'aide ? Garde sous la main : ton **Project URL**, ta clé **anon**, et
> confirme que le **script SQL** a été lancé. Avec ces 3 éléments, tout fonctionne.

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

La connexion se fait par **email + mot de passe** :

- **En local (sans Supabase)** : connecte-toi avec l'identifiant **`admin`** et le
  mot de passe **`solarnova`** (mode démo, ⚠️ inactif en production).
- **En production (avec Supabase)** : entre ton **email** et ton **mot de passe**.
  Les comptes sont **créés par le super admin** (pas d'inscription publique) ; le
  mot de passe est généré automatiquement et envoyé par email.

### ⚙️ Étape indispensable : déployer la fonction de gestion des comptes

Créer un compte + générer un mot de passe se fait **côté serveur** (la clé secrète
ne doit jamais être dans le navigateur). Déploie **une fois** la petite fonction
fournie :

```bash
supabase functions deploy admin-users
```

(Optionnel mais recommandé) pour que le mot de passe parte **par email** au
nouvel utilisateur, ajoute une clé Resend (gratuit) :

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set MAIL_FROM="SolarNova <onboarding@resend.dev>"
```

> Sans clé email, **aucun blocage** : le mot de passe généré s'affiche **une fois**
> à l'écran pour le super admin, qui le transmet à la personne.

### Rôles & droits d'accès

- **La première personne qui se connecte à `/admin` devient automatiquement
  super administrateur** (tous les droits).

  > 💡 Pour ce tout premier compte, crée-le dans Supabase →
  > **Authentication → Users → Add user** (email + mot de passe), puis connecte-toi.
- Le super admin, dans les onglets **Rôles & accès** et **Utilisateurs** :
  1. crée des rôles (ex. « Éditeur ») et coche leurs permissions ;
  2. **crée un compte** par email + rôle (onglet Utilisateurs → « Créer »).
- Une personne **sans rôle attribué** voit « Accès non attribué ».

### Comment ajouter ton équipe

Il n'y a **pas de page d'inscription publique**. Dans `/admin` → onglet
**Utilisateurs** → **Créer un compte** : tu saisis l'**email + le rôle**. Un mot
de passe fort est **généré et envoyé par email**. La personne se connecte sur
`/admin` avec son email + ce mot de passe, puis peut le changer dans **Mon compte**
(elle peut aussi y définir son nom affiché).

Le super admin peut aussi **réinitialiser** le mot de passe d'un compte (bouton 🔑)
ou **supprimer** un compte.

> 🔒 On ne peut pas supprimer/rétrograder le **dernier** super administrateur
> (sécurité anti-verrouillage).

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

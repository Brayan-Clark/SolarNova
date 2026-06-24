// ============================================================
//  Rôles & permissions (RBAC) — SolarNova
// ============================================================
//  - Catalogue fixe de PERMISSIONS (capacités de l'app).
//  - Rôles système : super_admin (tout) + admin.
//  - Rôles personnalisés : créés par le super admin, avec un sous-
//    ensemble de permissions.
//  - 1er utilisateur (prod) = super_admin automatiquement.
//
//  Stockage via la couche de contenu : tables Supabase en prod
//  (app_roles / app_user_roles), localStorage en local.
// ------------------------------------------------------------
import {
  listContent,
  saveContent,
  removeContent,
  isLocalMode,
} from "./content.js";
import { getSupabase, functionUrl, supabaseAnonKey } from "./supabase.js";
import { AUTH_MODE } from "./auth.js";

// Capacités disponibles dans le back-office.
export const PERMISSIONS = [
  { id: "articles.manage", label: "Gérer les articles" },
  { id: "solutions.manage", label: "Gérer les solutions" },
  { id: "reviews.moderate", label: "Modérer les avis" },
  { id: "leads.view", label: "Voir les demandes" },
  { id: "roles.manage", label: "Gérer les rôles & accès" },
  { id: "users.manage", label: "Gérer les utilisateurs" },
];

export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.id);

// Rôles système (non supprimables). "*" = toutes les permissions.
export const SYSTEM_ROLES = [
  {
    name: "super_admin",
    label: "Super administrateur",
    permissions: ["*"],
    system: true,
  },
  {
    name: "admin",
    label: "Administrateur",
    permissions: [
      "articles.manage",
      "solutions.manage",
      "reviews.moderate",
      "leads.view",
    ],
    system: true,
  },
];

const ROLES_COLL = "app_roles";
const USER_ROLES_COLL = "app_user_roles";

export function hasPerm(perms, perm) {
  return Array.isArray(perms) && (perms.includes("*") || perms.includes(perm));
}

// Liste des rôles, dédoublonnée par "name". En local, on garantit la présence
// des rôles système et on nettoie d'éventuels doublons résiduels (auto-réparation).
export async function loadRoles() {
  const roles = await listContent(ROLES_COLL);

  const byName = new Map();
  const duplicates = [];
  for (const r of roles) {
    if (!r || !r.name) continue;
    if (byName.has(r.name)) duplicates.push(r);
    else byName.set(r.name, r);
  }

  if (isLocalMode) {
    // Supprime les doublons stockés localement.
    for (const d of duplicates) {
      if (d.id != null) await removeContent(ROLES_COLL, d.id);
    }
    // Garantit la présence des rôles système.
    for (const sys of SYSTEM_ROLES) {
      if (!byName.has(sys.name)) {
        const res = await saveContent(ROLES_COLL, { ...sys });
        if (res.ok) byName.set(sys.name, res.item);
      }
    }
  }

  return Array.from(byName.values());
}

export function saveRole(role) {
  return saveContent(ROLES_COLL, role);
}

export function removeRole(id) {
  return removeContent(ROLES_COLL, id);
}

export function loadUserRoles() {
  return listContent(USER_ROLES_COLL);
}

export function assignUserRole(entry) {
  // entry : { id?, email, role_name, user_id? }
  return saveContent(USER_ROLES_COLL, entry);
}

export function removeUserRole(id) {
  return removeContent(USER_ROLES_COLL, id);
}

// Appel authentifié à l'Edge Function admin-users (création/suppression
// de comptes). Renvoie { ok, error? }.
async function callAdminUsers(body) {
  const sb = await getSupabase();
  if (!sb) return { ok: false, error: "Supabase indisponible." };
  const {
    data: { session },
  } = await sb.auth.getSession();
  if (!session) return { ok: false, error: "Session expirée." };
  try {
    const res = await fetch(functionUrl("admin-users"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "Erreur serveur." };
    return { ok: true, data };
  } catch (e) {
    // Échec réseau = fonction très probablement non déployée.
    return {
      ok: false,
      error:
        "Fonction « admin-users » injoignable. Déployez-la (supabase functions deploy admin-users) " +
        "ou créez le compte dans Supabase puis attribuez-lui un rôle ci-dessous.",
    };
  }
}

// URL du site (pour le lien « Se connecter » dans l'email).
function siteUrl() {
  if (typeof window === "undefined") return "";
  return window.location.origin + window.location.pathname.replace(/\/admin\/?$/, "");
}

// Crée un compte : le mot de passe FORT est généré côté serveur (Edge
// Function) et envoyé par email. Renvoie aussi le mot de passe en clair
// (à afficher une fois) au cas où l'email ne serait pas configuré.
export async function createUser({ email, role_name }) {
  if (AUTH_MODE === "dev") {
    // En local : pas de vrai compte → on enregistre juste l'attribution
    // (simulation de démo, aucun mot de passe réel).
    return saveContent(USER_ROLES_COLL, {
      email: email.trim().toLowerCase(),
      role_name,
    });
  }
  return callAdminUsers({ action: "create", email, role_name, site_url: siteUrl() });
}

// Réinitialise le mot de passe d'un compte existant (nouveau mot de passe
// fort généré et envoyé par email).
export async function resetUserPassword(email) {
  if (AUTH_MODE === "dev") {
    return { ok: false, error: "Indisponible en mode démo (local)." };
  }
  return callAdminUsers({ action: "reset", email, site_url: siteUrl() });
}

// Supprime un compte (auth + attribution) en production.
export async function deleteUser(email) {
  if (AUTH_MODE === "dev") {
    const all = await listContent(USER_ROLES_COLL);
    const row = all.find((u) => u.email === email);
    return row ? removeContent(USER_ROLES_COLL, row.id) : { ok: true };
  }
  return callAdminUsers({ action: "delete", email });
}

// Calcule l'ensemble des permissions de l'utilisateur courant.
export async function getCurrentPermissions(user) {
  if (!user) return [];
  // En mode dev (local), l'unique utilisateur est super admin.
  if (AUTH_MODE === "dev") return ["*"];

  const [assigns, roles] = await Promise.all([
    listContent(USER_ROLES_COLL),
    listContent(ROLES_COLL),
  ]);
  const mine = assigns.find(
    (a) => a.user_id === user.id || (a.email && a.email === user.email),
  );
  if (!mine) return [];
  const role = roles.find((r) => r.name === mine.role_name);
  return role ? role.permissions || [] : [];
}

// 1er utilisateur = super admin : en prod, si aucun super_admin n'existe,
// le premier qui se connecte le devient (via une fonction SQL sécurisée).
export async function bootstrapSuperAdmin() {
  if (AUTH_MODE === "dev") return;
  const sb = await getSupabase();
  if (!sb) return;
  try {
    // Fonction SQL "security definer" (voir schema.sql) : n'agit que s'il
    // n'y a encore aucun super_admin. Idempotente et sans risque.
    await sb.rpc("claim_super_admin");
  } catch {
    // RPC absente (schéma pas encore appliqué) : on ignore silencieusement.
  }
}

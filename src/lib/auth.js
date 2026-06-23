// ============================================================
//  Authentification admin — SolarNova
// ============================================================
//  Deux modes, choisis automatiquement :
//   - "dev"      : Supabase NON configuré (local) → accès via un
//                  identifiant de DÉVELOPPEMENT codé en dur.
//                  ⚠️ Volontairement NON valable en production.
//   - "supabase" : Supabase configuré → vrai compte Supabase Auth.
//                  (Les identifiants de dev sont alors IGNORÉS.)
// ------------------------------------------------------------
import { getSupabase, isSupabaseConfigured } from "./supabase.js";

export const AUTH_MODE = isSupabaseConfigured ? "supabase" : "dev";
export const isDevAuth = AUTH_MODE === "dev";

// ⚠️ Identifiants de DÉVELOPPEMENT — UNIQUEMENT en local.
//    Change-les si tu veux, mais ils ne servent qu'en l'absence de
//    Supabase. Dès que Supabase est configuré, ils ne fonctionnent plus.
const DEV_USER = "admin";
const DEV_PASS = "solarnova";
const DEV_SESSION_KEY = "solarnova:admin-dev-session";

export const DEV_CREDENTIALS = { user: DEV_USER, pass: DEV_PASS };

export async function signIn(identifier, password) {
  if (AUTH_MODE === "dev") {
    if (identifier.trim() === DEV_USER && password === DEV_PASS) {
      sessionStorage.setItem(DEV_SESSION_KEY, "1");
      return { ok: true, user: { email: DEV_USER, dev: true } };
    }
    return { ok: false, error: "Identifiants de développement invalides." };
  }
  const sb = await getSupabase();
  if (!sb) return { ok: false, error: "Client Supabase indisponible." };
  const { data, error } = await sb.auth.signInWithPassword({
    email: identifier,
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}

export async function signOut() {
  if (AUTH_MODE === "dev") {
    sessionStorage.removeItem(DEV_SESSION_KEY);
    return;
  }
  const sb = await getSupabase();
  if (sb) await sb.auth.signOut();
}

export async function getCurrentUser() {
  if (AUTH_MODE === "dev") {
    return sessionStorage.getItem(DEV_SESSION_KEY)
      ? { email: DEV_USER, dev: true }
      : null;
  }
  const sb = await getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data?.session?.user || null;
}

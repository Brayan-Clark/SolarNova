// ============================================================
//  Edge Function "admin-users" — création de comptes par l'admin
// ============================================================
//  Permet à un utilisateur ayant la permission "users.manage" de
//  CRÉER ou SUPPRIMER des comptes (email + mot de passe), puis
//  d'attribuer un rôle. Utilise la clé service_role (jamais exposée
//  au navigateur) → c'est pourquoi ça passe par une Edge Function.
//
//  Déploiement (vérification du JWT activée = défaut) :
//    supabase functions deploy admin-users
//  (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés
//   automatiquement par la plateforme.)
// ------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1. Vérifier que l'appelant est connecté ET a la permission "users.manage".
  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await caller.auth.getUser();
  if (!userData?.user) return json({ error: "Non authentifié." }, 401);
  const { data: allowed, error: permErr } = await caller.rpc("has_permission", {
    perm: "users.manage",
  });
  if (permErr || !allowed) return json({ error: "Permission refusée." }, 403);

  // 2. Exécuter l'action avec la clé service_role.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let payload: { action?: string; email?: string; password?: string; role_name?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Corps invalide." }, 400);
  }
  const email = (payload.email || "").trim().toLowerCase();

  if (payload.action === "create") {
    if (!email || !payload.password) {
      return json({ error: "Email et mot de passe requis." }, 400);
    }
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
    });
    if (error) return json({ error: error.message }, 400);

    // Attribue le rôle (si fourni).
    if (payload.role_name) {
      await admin.from("app_user_roles").upsert(
        { email, user_id: created.user?.id, role_name: payload.role_name },
        { onConflict: "email" },
      );
    }
    return json({ ok: true, user_id: created.user?.id });
  }

  if (payload.action === "delete") {
    if (!email) return json({ error: "Email requis." }, 400);
    // Récupère l'attribution pour connaître l'user_id.
    const { data: row } = await admin
      .from("app_user_roles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (row?.user_id) {
      await admin.auth.admin.deleteUser(row.user_id);
    }
    await admin.from("app_user_roles").delete().eq("email", email);
    return json({ ok: true });
  }

  return json({ error: "Action inconnue." }, 400);
});

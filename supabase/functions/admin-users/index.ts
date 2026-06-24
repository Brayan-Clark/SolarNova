// ============================================================
//  Edge Function "admin-users" — gestion des comptes par l'admin
// ============================================================
//  Permet à un utilisateur ayant la permission "users.manage" de :
//   - CREATE : créer un compte (email + mot de passe FORT généré
//     automatiquement), lui attribuer un rôle, et envoyer le mot de
//     passe par email (si un service d'email est configuré).
//   - RESET  : régénérer le mot de passe d'un compte existant.
//   - DELETE : supprimer un compte (auth + attribution de rôle).
//
//  Utilise la clé service_role (jamais exposée au navigateur) →
//  c'est pourquoi ça passe par une Edge Function.
//
//  Déploiement :
//    supabase functions deploy admin-users
//  (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés
//   automatiquement par la plateforme.)
//
//  Email (optionnel) : pour envoyer le mot de passe au nouvel
//  utilisateur, configure ces secrets :
//    supabase secrets set RESEND_API_KEY=...   (compte resend.com gratuit)
//    supabase secrets set MAIL_FROM="SolarNova <onboarding@resend.dev>"
//  Sans cela, le mot de passe est simplement RENVOYÉ au super admin
//  (affiché une fois à l'écran) pour transmission manuelle.
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

// Génère un mot de passe FORT et aléatoire (sans caractères ambigus).
function generatePassword(length = 16): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // sans I, O
  const lower = "abcdefghijkmnpqrstuvwxyz"; // sans l, o
  const digits = "23456789"; // sans 0, 1
  const symbols = "!@#$%&*?-_=+";
  const all = upper + lower + digits + symbols;
  const pick = (set: string, n: number) => {
    const out: string[] = [];
    const rnd = new Uint32Array(n);
    crypto.getRandomValues(rnd);
    for (let i = 0; i < n; i++) out.push(set[rnd[i] % set.length]);
    return out;
  };
  // Garantit au moins 1 de chaque catégorie, complète aléatoirement, puis mélange.
  let chars = [
    ...pick(upper, 1),
    ...pick(lower, 1),
    ...pick(digits, 1),
    ...pick(symbols, 1),
    ...pick(all, Math.max(0, length - 4)),
  ];
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  chars = chars
    .map((c, i) => ({ c, k: order[i] }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
  return chars.join("");
}

// Envoie le mot de passe par email via Resend. Renvoie true si l'email part.
async function sendPasswordEmail(
  email: string,
  password: string,
  siteUrl: string,
  isReset: boolean,
): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return false;
  const from = Deno.env.get("MAIL_FROM") || "SolarNova <onboarding@resend.dev>";
  const adminUrl = (siteUrl || "").replace(/\/$/, "") + "/admin";
  const title = isReset
    ? "Votre mot de passe SolarNova a été réinitialisé"
    : "Votre accès à l'administration SolarNova";
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#1f2937">
      <h2 style="color:#16a34a">SolarNova — espace d'administration</h2>
      <p>${isReset ? "Votre mot de passe a été réinitialisé." : "Un compte a été créé pour vous."}</p>
      <p>Voici vos identifiants de connexion :</p>
      <table style="border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:4px 12px;color:#6b7280">Email</td>
            <td style="padding:4px 12px;font-weight:bold">${email}</td></tr>
        <tr><td style="padding:4px 12px;color:#6b7280">Mot de passe</td>
            <td style="padding:4px 12px;font-family:monospace;font-weight:bold">${password}</td></tr>
      </table>
      <p><a href="${adminUrl}" style="background:#16a34a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Se connecter</a></p>
      <p style="color:#6b7280;font-size:13px">Par sécurité, changez ce mot de passe après votre première connexion
      (menu « Mon compte »).</p>
    </div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: email, subject: title, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
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
  let payload: { action?: string; email?: string; role_name?: string; site_url?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Corps invalide." }, 400);
  }
  const email = (payload.email || "").trim().toLowerCase();
  const siteUrl = payload.site_url || "";

  if (payload.action === "create") {
    if (!email) return json({ error: "Email requis." }, 400);
    const password = generatePassword(16);
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // pas de validation d'email à faire
    });
    if (error) return json({ error: error.message }, 400);

    // Attribue le rôle (si fourni).
    if (payload.role_name) {
      await admin.from("app_user_roles").upsert(
        { email, user_id: created.user?.id, role_name: payload.role_name },
        { onConflict: "email" },
      );
    }
    const emailed = await sendPasswordEmail(email, password, siteUrl, false);
    // On renvoie le mot de passe pour qu'il soit affiché UNE fois au super
    // admin (filet de sécurité si l'email n'est pas configuré).
    return json({ ok: true, user_id: created.user?.id, password, emailed });
  }

  if (payload.action === "reset") {
    if (!email) return json({ error: "Email requis." }, 400);
    const { data: row } = await admin
      .from("app_user_roles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (!row?.user_id) return json({ error: "Utilisateur introuvable." }, 404);
    const password = generatePassword(16);
    const { error } = await admin.auth.admin.updateUserById(row.user_id, {
      password,
    });
    if (error) return json({ error: error.message }, 400);
    const emailed = await sendPasswordEmail(email, password, siteUrl, true);
    return json({ ok: true, password, emailed });
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

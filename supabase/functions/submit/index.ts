// ============================================================
//  Edge Function "submit" — soumission sécurisée des formulaires
// ============================================================
//  Rôle :
//   1. Vérifier le token Cloudflare Turnstile (anti-bot) côté serveur.
//   2. Insérer l'enregistrement via la clé service_role (contourne RLS).
//
//  Avantage : le RLS peut alors INTERDIRE toute écriture directe par la
//  clé anon — seules les requêtes validées par cette fonction passent.
//
//  3. (Optionnel) Envoyer un email de notification à chaque
//     nouvelle demande de contact / devis (via Resend).
//
//  Déploiement :
//    supabase functions deploy submit --no-verify-jwt
//  Secrets à définir (supabase secrets set ...) :
//    TURNSTILE_SECRET_KEY   (clé secrète Turnstile)        — anti-bot
//    RESEND_API_KEY         (clé API Resend)               — email (optionnel)
//    NOTIFY_TO              (email qui reçoit les demandes) — email (optionnel)
//    NOTIFY_FROM            (expéditeur vérifié sur Resend) — email (optionnel)
//  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont injectés
//  automatiquement par la plateforme.
// ------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TABLES: Record<string, string> = {
  review: "reviews",
  contact: "contacts",
  quote: "quotes",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(
  secret: string,
  token: string | undefined,
  ip: string | null,
): Promise<boolean> {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const r = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const data = await r.json();
  return data.success === true;
}

// Notification email via Resend (silencieuse si non configurée).
async function notifyByEmail(action: string, payload: Record<string, unknown>) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("NOTIFY_TO");
  const from = Deno.env.get("NOTIFY_FROM");
  // On ne notifie que les leads (contact / devis), et seulement si configuré.
  if (!apiKey || !to || !from || (action !== "contact" && action !== "quote")) {
    return;
  }

  const titre =
    action === "contact"
      ? "📩 Nouveau message de contact"
      : "🧮 Nouvelle demande de devis (calculateur)";

  const lignes = Object.entries(payload)
    .map(([k, v]) => {
      const val =
        typeof v === "object" && v !== null
          ? JSON.stringify(v, null, 2)
          : String(v ?? "—");
      return `<tr><td style="padding:4px 12px 4px 0;color:#888;vertical-align:top"><b>${k}</b></td><td style="padding:4px 0"><pre style="margin:0;font-family:inherit;white-space:pre-wrap">${val}</pre></td></tr>`;
    })
    .join("");

  const html = `<div style="font-family:system-ui,sans-serif;color:#111">
    <h2 style="color:#00b34a">${titre}</h2>
    <table style="border-collapse:collapse">${lignes}</table>
    <p style="color:#aaa;font-size:12px;margin-top:24px">— Notification automatique SolarNova</p>
  </div>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject: titre, html }),
    });
  } catch (e) {
    // L'email ne doit jamais faire échouer l'enregistrement en base.
    console.error("Envoi email échoué :", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  let payloadBody: { action?: string; payload?: unknown; token?: string };
  try {
    payloadBody = await req.json();
  } catch {
    return json({ error: "Corps de requête invalide." }, 400);
  }

  const { action, payload, token } = payloadBody;

  const table = action ? TABLES[action] : undefined;
  if (!table || typeof payload !== "object" || payload === null) {
    return json({ error: "Requête invalide." }, 400);
  }

  // 1. Vérification anti-bot (si un secret Turnstile est configuré)
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (secret) {
    const ok = await verifyTurnstile(
      secret,
      token,
      req.headers.get("CF-Connecting-IP"),
    );
    if (!ok) {
      return json({ error: "Échec de la vérification anti-robot." }, 403);
    }
  }

  // 2. Insertion via service_role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error } = await supabase.from(table).insert(payload);
  if (error) {
    return json({ error: error.message }, 500);
  }

  // 3. Notification email (best-effort, n'affecte pas la réponse)
  await notifyByEmail(action!, payload as Record<string, unknown>);

  return json({ ok: true });
});

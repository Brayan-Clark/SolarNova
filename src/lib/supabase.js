// ============================================================
//  Client Supabase — tolérant à l'absence de configuration
//  + chargement PARESSEUX (lazy) pour alléger le bundle initial.
// ============================================================
//  Tant que PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY ne
//  sont pas définis (.env), getSupabase() renvoie null et
//  isSupabaseConfigured vaut false. L'application continue de
//  fonctionner sans planter (les couches data basculent en mode
//  "offline" + message d'information).
//
//  La librairie @supabase/supabase-js (~lourde) n'est téléchargée
//  par le navigateur qu'au PREMIER appel réel à la base (import
//  dynamique), pas au chargement de la page.
// ------------------------------------------------------------

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Exposés pour appeler les Edge Functions (URL dérivée automatiquement).
export const supabaseUrl = url || "";
export const supabaseAnonKey = anonKey || "";
export const functionUrl = (name) =>
  url ? `${url.replace(/\/$/, "")}/functions/v1/${name}` : "";

// Clé publique Turnstile (anti-bot). Si absente, aucun widget n'est
// affiché et les formulaires fonctionnent comme avant.
export const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || "";

// URL de l'Edge Function de soumission sécurisée (vérif Turnstile +
// écriture via service_role). Si définie, toutes les écritures passent
// par elle ; sinon on insère directement via la clé anon (RLS).
export const submitEndpoint = import.meta.env.PUBLIC_SUBMIT_ENDPOINT || "";

// Message standard affiché quand une action nécessite la base
// alors qu'elle n'est pas (encore) connectée.
export const DB_OFFLINE_MESSAGE =
  "Base de données non connectée — action non enregistrée. (Voir README pour la configuration Supabase.)";

// Instance mémoïsée (créée une seule fois).
let _client = null;

/**
 * Renvoie le client Supabase (chargé à la demande), ou null si la
 * base n'est pas configurée.
 */
export async function getSupabase() {
  if (!isSupabaseConfigured) return null;
  if (_client) return _client;
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(url, anonKey);
  return _client;
}

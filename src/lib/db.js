// ============================================================
//  Couche d'accès aux données SolarNova
// ============================================================
//  Chaque fonction renvoie un objet { ok, offline, data?, error? } :
//   - ok=true            → opération réussie
//   - offline=true       → ni Edge Function ni Supabase configurés :
//                          on n'a rien planté, l'appelant affiche un message
//   - ok=false,error     → backend joignable mais en erreur
//
//  Deux modes d'écriture :
//   1. Edge Function (PUBLIC_SUBMIT_ENDPOINT défini) → mode RECOMMANDÉ :
//      la fonction vérifie le token Turnstile puis écrit via service_role.
//      Le RLS peut alors interdire toute écriture directe par la clé anon.
//   2. Insertion directe via la clé anon (RLS) — si aucune Edge Function.
//
//  Tables attendues côté Supabase (voir README pour le SQL) :
//   - reviews / contacts / quotes
// ------------------------------------------------------------
import {
  submitEndpoint,
  isSupabaseConfigured,
  turnstileSiteKey,
  DB_OFFLINE_MESSAGE,
} from "./supabase.js";
import { listContent, saveContent, isLocalMode } from "./content.js";

export { isSupabaseConfigured, turnstileSiteKey, DB_OFFLINE_MESSAGE };

const TABLES = { review: "reviews", contact: "contacts", quote: "quotes" };

// Écriture générique :
//  1. Edge Function (sécurisée) si PUBLIC_SUBMIT_ENDPOINT est défini ;
//  2. sinon, via la couche de contenu (Supabase en prod, localStorage en local).
async function writeRecord(action, payload, token) {
  // --- Mode sécurisé : Edge Function ---
  if (submitEndpoint) {
    try {
      const res = await fetch(submitEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload, token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, offline: false, error: body };
      }
      return { ok: true, offline: false };
    } catch (error) {
      return { ok: false, offline: false, error };
    }
  }

  // --- Mode direct : couche de contenu (Supabase OU localStorage) ---
  const res = await saveContent(TABLES[action], payload);
  // En local, l'écriture réussit toujours (localStorage) → on signale
  // simplement que c'est un enregistrement local via "local: true".
  return { ok: res.ok, offline: false, local: isLocalMode, error: res.error };
}

// ---------- AVIS ----------
export async function fetchReviews() {
  // Avis approuvés uniquement pour l'affichage public.
  const data = await listContent("reviews", { approvedOnly: true });
  return { ok: true, offline: false, data };
}

export function insertReview(review, token) {
  return writeRecord(
    "review",
    {
      name: review.name,
      solution: review.solution,
      rating: review.rating,
      comment: review.comment,
      approved: false, // modération : invisible tant que non validé
    },
    token,
  );
}

// ---------- CONTACT / LEADS ----------
export function insertContact(contact, token) {
  return writeRecord(
    "contact",
    {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      subject: contact.subject,
      message: contact.message,
    },
    token,
  );
}

// ---------- DEVIS CALCULATEUR ----------
export function insertQuote(quote, token) {
  return writeRecord(
    "quote",
    {
      appliances: quote.appliances, // jsonb
      total_peak_watts: quote.totalPeakWatts,
      total_daily_wh: quote.totalDailyWh,
      total_monthly_kwh: quote.totalMonthlyKWh,
      suggested_kit: quote.suggestedKit,
      contact_name: quote.contactName || null,
      contact_email: quote.contactEmail || null,
      contact_phone: quote.contactPhone || null,
    },
    token,
  );
}

// ---------- NEWSLETTER ----------
// Inscription directe (sans Edge Function) : un email simple, géré par la
// couche de contenu (Supabase en prod, localStorage en local).
export async function insertNewsletter(email) {
  const res = await saveContent("newsletter", { email });
  // Email déjà inscrit (contrainte unique) → considéré comme un succès.
  if (
    !res.ok &&
    res.error &&
    /duplicate|unique|23505/i.test(JSON.stringify(res.error))
  ) {
    return { ok: true, already: true, local: isLocalMode };
  }
  return { ok: res.ok, local: isLocalMode, error: res.error };
}

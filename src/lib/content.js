// ============================================================
//  Couche de contenu unifiée — SolarNova
// ============================================================
//  Gère articles, solutions, avis (et lecture des demandes) avec
//  DEUX modes transparents :
//   - "supabase" : si la base est configurée (production)
//   - "local"    : sinon, via localStorage (développement / démo)
//
//  Le site public ET l'admin utilisent cette couche : ce qu'on
//  modifie dans l'admin se reflète immédiatement sur le site.
//  En mode local, le contenu est initialisé (seedé) à partir de
//  src/data/seed.js au premier accès.
// ------------------------------------------------------------
import { getSupabase, isSupabaseConfigured } from "./supabase.js";
import { solutionsSeed, articlesSeed, reviewsSeed } from "../data/seed.js";

export const STORAGE_MODE = isSupabaseConfigured ? "supabase" : "local";
export const isLocalMode = !isSupabaseConfigured;

const SEEDS = {
  solutions: solutionsSeed,
  articles: articlesSeed,
  reviews: reviewsSeed,
};

const LS_PREFIX = "solarnova:";
const lsKey = (coll) => LS_PREFIX + coll;

function lsRead(coll) {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(lsKey(coll));
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function lsWrite(coll, arr) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(lsKey(coll), JSON.stringify(arr));
}

// Renvoie le contenu local, en le seedant depuis les défauts au 1er accès.
function lsSeeded(coll) {
  let arr = lsRead(coll);
  if (arr === null) {
    const seed = SEEDS[coll] || [];
    arr = seed.map((it, i) => {
      const copy = { id: it.id ?? i + 1, ...it };
      // Les avis par défaut sont considérés comme approuvés.
      if (coll === "reviews" && copy.approved === undefined) copy.approved = true;
      return copy;
    });
    lsWrite(coll, arr);
  }
  return arr;
}

const nextId = (arr) =>
  arr.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0) + 1;

// Uniformise un avis pour l'affichage (champ "date" lisible).
function normalizeReview(r) {
  if (r.date) return r;
  const d = r.created_at ? new Date(r.created_at) : new Date();
  return {
    ...r,
    date: d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
}

/**
 * Liste le contenu d'une collection.
 * @param {string} coll  "solutions" | "articles" | "reviews" | "contacts" | "quotes"
 * @param {object} opts  { approvedOnly?: boolean }  (avis uniquement)
 */
export async function listContent(coll, opts = {}) {
  if (STORAGE_MODE === "local") {
    let arr = lsSeeded(coll).slice();
    if (coll === "reviews") {
      arr = arr.map(normalizeReview);
      if (opts.approvedOnly) arr = arr.filter((r) => r.approved !== false);
    }
    return arr;
  }

  // --- Supabase ---
  const sb = await getSupabase();
  if (!sb) return SEEDS[coll] ? SEEDS[coll].slice() : [];
  let q = sb.from(coll).select("*");
  if (coll === "reviews" || coll === "articles" || coll === "contacts" || coll === "quotes") {
    q = q.order("created_at", { ascending: false });
  }
  const { data, error } = await q;
  // Si la table n'existe pas encore (ex. articles/solutions), on retombe
  // sur les données par défaut plutôt que de planter.
  if (error || !data) return SEEDS[coll] ? SEEDS[coll].slice() : [];
  return coll === "reviews" ? data.map(normalizeReview) : data;
}

/** Crée (id absent) ou met à jour (id présent) un élément. */
export async function saveContent(coll, item) {
  if (STORAGE_MODE === "local") {
    const arr = lsSeeded(coll);
    let saved;
    if (item.id == null) {
      saved = { ...item, id: nextId(arr) };
      arr.unshift(saved);
    } else {
      const i = arr.findIndex((x) => String(x.id) === String(item.id));
      if (i >= 0) {
        saved = { ...arr[i], ...item };
        arr[i] = saved;
      } else {
        saved = { ...item };
        arr.unshift(saved);
      }
    }
    lsWrite(coll, arr);
    return { ok: true, item: saved };
  }

  const sb = await getSupabase();
  if (!sb) return { ok: false, error: "Client Supabase indisponible." };
  // Pas de .select() ici : la relecture serait bloquée par le RLS pour les
  // insertions publiques (ex. avis non approuvé). L'admin re-liste après coup.
  const { error } = await sb.from(coll).upsert(item);
  if (error) return { ok: false, error };
  return { ok: true, item };
}

/** Supprime un élément par id. */
export async function removeContent(coll, id) {
  if (STORAGE_MODE === "local") {
    const arr = lsSeeded(coll).filter((x) => String(x.id) !== String(id));
    lsWrite(coll, arr);
    return { ok: true };
  }
  const sb = await getSupabase();
  if (!sb) return { ok: false };
  const { error } = await sb.from(coll).delete().eq("id", id);
  if (error) return { ok: false, error };
  return { ok: true };
}

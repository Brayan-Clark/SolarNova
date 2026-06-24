// ============================================================
//  Back-office SolarNova (Alpine.js)
// ============================================================
import {
  listContent,
  saveContent,
  removeContent,
  STORAGE_MODE,
  isLocalMode,
} from "../lib/content.js";
import {
  signIn,
  updateMyProfile,
  signOut,
  getCurrentUser,
  AUTH_MODE,
  isDevAuth,
  DEV_CREDENTIALS,
} from "../lib/auth.js";
import {
  PERMISSIONS,
  SYSTEM_ROLES,
  hasPerm,
  loadRoles,
  saveRole,
  removeRole,
  loadUserRoles,
  assignUserRole,
  removeUserRole,
  createUser,
  resetUserPassword,
  deleteUser,
  getCurrentPermissions,
  bootstrapSuperAdmin,
} from "../lib/permissions.js";

const blankArticle = () => ({
  category: "Guide",
  date: new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
  readTime: "5 min de lecture",
  image: "",
  title: "",
  excerpt: "",
  content: "",
});

const blankSolution = () => ({
  name: "",
  tier: "standard",
  subtitle: "",
  maxWatts: 0,
  maxDailyWh: 0,
  priceRange: "",
  icon: "fa-solid fa-solar-panel",
  color: "from-green-600 to-green-800",
  components: [],
});

export function createAdminApp() {
  return {
    // --- Auth ---
    authMode: AUTH_MODE,
    isDevAuth,
    devCreds: DEV_CREDENTIALS,
    storageMode: STORAGE_MODE,
    isLocalMode,
    authChecked: false,
    authed: false,
    authUser: null,
    loginForm: { id: "", pass: "" },
    loginError: "",
    busy: false,
    // Visibilité des champs mot de passe (afficher / masquer).
    pwShow: { login: false, new: false, confirm: false },

    // --- Permissions ---
    permissions: [], // permissions de l'utilisateur courant
    permsCatalog: PERMISSIONS,
    roles: [],
    userRoles: [],

    // --- Données ---
    tab: "articles",
    articles: [],
    solutions: [],
    reviews: [],
    contacts: [],
    quotes: [],
    newsletter: [],

    // --- Édition rôle / utilisateur ---
    roleEdit: null, // rôle en cours d'édition
    newUserForm: { email: "", role_name: "" },
    // Mot de passe généré à afficher UNE fois après création / réinit.
    generatedCred: null, // { email, password, emailed }

    // --- Mon compte (libre-service) ---
    profileForm: { displayName: "", password: "", password2: "" },

    // --- Édition ---
    editColl: null, // 'articles' | 'solutions'
    editItem: null,
    componentsText: "",

    // --- Toast ---
    toast: { show: false, message: "", type: "success" },

    async init() {
      this.authUser = await getCurrentUser();
      this.authed = Boolean(this.authUser);
      this.authChecked = true;
      if (this.authed) await this.afterAuth();
    },

    // Connexion : identifiant + mot de passe (dev) OU email + mot de passe (prod).
    async login() {
      this.loginError = "";
      this.busy = true;
      const res = await signIn(this.loginForm.id, this.loginForm.pass);
      this.busy = false;
      if (res.ok) {
        this.authUser = res.user;
        this.authed = true;
        this.loginForm = { id: "", pass: "" };
        await this.afterAuth();
      } else {
        this.loginError = res.error || "Connexion impossible.";
      }
    },

    // Après connexion : 1er utilisateur → super admin, puis calcul des droits.
    async afterAuth() {
      await bootstrapSuperAdmin();
      this.permissions = await getCurrentPermissions(this.authUser);
      // Pré-remplit le nom affiché dans « Mon compte ».
      this.profileForm.displayName =
        this.authUser?.user_metadata?.display_name || "";
      // Onglet par défaut = premier auquel l'utilisateur a droit.
      this.tab = this.firstAllowedTab();
      await this.loadAll();
    },

    can(perm) {
      return hasPerm(this.permissions, perm);
    },

    get authorized() {
      return this.permissions.length > 0;
    },

    firstAllowedTab() {
      const map = [
        ["articles", "articles.manage"],
        ["solutions", "solutions.manage"],
        ["reviews", "reviews.moderate"],
        ["leads", "leads.view"],
        ["roles", "roles.manage"],
        ["users", "users.manage"],
      ];
      const found = map.find(([, perm]) => this.can(perm));
      return found ? found[0] : "articles";
    },

    async logout() {
      await signOut();
      this.authed = false;
      this.authUser = null;
    },

    async loadAll() {
      try {
        if (this.can("articles.manage")) this.articles = await listContent("articles");
        if (this.can("solutions.manage")) this.solutions = await listContent("solutions");
        if (this.can("reviews.moderate")) this.reviews = await listContent("reviews");
        if (this.can("leads.view")) {
          this.contacts = await listContent("contacts");
          this.quotes = await listContent("quotes");
          this.newsletter = await listContent("newsletter");
        }
        if (this.can("roles.manage")) this.roles = await loadRoles();
        if (this.can("users.manage")) {
          this.userRoles = await loadUserRoles();
          if (!this.roles.length) this.roles = await loadRoles();
        }
      } catch (e) {
        this.showToast("Erreur de chargement des données.", "error");
      }
    },

    // ---------- Rôles ----------
    roleLabel(name) {
      const r = this.roles.find((x) => x.name === name);
      return r ? r.label : name;
    },

    startCreateRole() {
      this.roleEdit = { label: "", name: "", permissions: [], system: false };
    },

    startEditRole(role) {
      this.roleEdit = JSON.parse(JSON.stringify(role));
    },

    cancelRole() {
      this.roleEdit = null;
    },

    togglePerm(perm) {
      const p = this.roleEdit.permissions;
      const i = p.indexOf(perm);
      if (i >= 0) p.splice(i, 1);
      else p.push(perm);
    },

    async saveRoleEdit() {
      const r = this.roleEdit;
      if (!r.label.trim()) {
        this.showToast("Le nom du rôle est obligatoire.", "error");
        return;
      }
      // Slug technique dérivé du label si nouveau rôle.
      if (!r.name) {
        r.name = r.label
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "");
      }
      this.busy = true;
      const res = await saveRole(r);
      this.busy = false;
      if (res.ok) {
        this.roleEdit = null;
        this.roles = await loadRoles();
        this.showToast("Rôle enregistré." + this.localNote(), "success");
      } else {
        this.showToast("Échec de l'enregistrement du rôle" + this.errText(res), "error");
      }
    },

    async deleteRole(role) {
      if (role.system) {
        this.showToast("Un rôle système ne peut pas être supprimé.", "error");
        return;
      }
      if (!confirm("Supprimer le rôle « " + role.label + " » ?")) return;
      const res = await removeRole(role.id);
      if (res.ok) {
        this.roles = await loadRoles();
        this.showToast("Rôle supprimé.", "success");
      } else {
        this.showToast("Échec de la suppression" + this.errText(res), "error");
      }
    },

    // ---------- Utilisateurs ----------
    // Crée un compte : email + rôle. Un mot de passe FORT est généré
    // automatiquement (côté serveur) et envoyé par email à la personne.
    // En local (démo), on enregistre seulement l'attribution de rôle.
    async createUserAccount() {
      const email = this.newUserForm.email.trim().toLowerCase();
      if (!email || !this.newUserForm.role_name) {
        this.showToast("Email et rôle requis.", "error");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showToast("Adresse email invalide.", "error");
        return;
      }
      this.generatedCred = null;
      this.busy = true;
      const res = await createUser({ email, role_name: this.newUserForm.role_name });
      this.busy = false;
      if (res.ok) {
        this.newUserForm = { email: "", role_name: "" };
        this.userRoles = await loadUserRoles();
        if (this.isLocalMode) {
          this.showToast("Accès ajouté (local, démo).", "success");
        } else {
          // Affiche le mot de passe généré (filet de sécurité).
          this.generatedCred = {
            email,
            password: res.data?.password || "",
            emailed: Boolean(res.data?.emailed),
          };
          this.showToast(
            res.data?.emailed
              ? "Compte créé. Mot de passe envoyé par email."
              : "Compte créé. Notez le mot de passe ci-dessous.",
            "success",
          );
        }
      } else {
        this.showToast("Échec" + this.errText(res), "error");
      }
    },

    // Réinitialise le mot de passe d'un utilisateur (nouveau généré + email).
    async resetPassword(entry) {
      if (!confirm("Réinitialiser le mot de passe de " + entry.email + " ?")) return;
      this.generatedCred = null;
      this.busy = true;
      const res = await resetUserPassword(entry.email);
      this.busy = false;
      if (res.ok) {
        this.generatedCred = {
          email: entry.email,
          password: res.data?.password || "",
          emailed: Boolean(res.data?.emailed),
        };
        this.showToast(
          res.data?.emailed
            ? "Mot de passe réinitialisé et envoyé par email."
            : "Mot de passe réinitialisé. Notez-le ci-dessous.",
          "success",
        );
      } else {
        this.showToast("Échec" + this.errText(res), "error");
      }
    },

    dismissCred() {
      this.generatedCred = null;
    },

    // Nombre de super administrateurs actuels.
    superAdminCount() {
      return this.userRoles.filter((u) => u.role_name === "super_admin").length;
    },

    // Change le rôle d'un utilisateur existant.
    async changeUserRole(entry, roleName) {
      // Garde-fou : ne pas rétrograder le DERNIER super admin.
      if (
        entry.role_name === "super_admin" &&
        roleName !== "super_admin" &&
        this.superAdminCount() <= 1
      ) {
        this.showToast(
          "Impossible : il doit rester au moins un super administrateur.",
          "error",
        );
        // On recharge pour remettre le <select> sur l'ancienne valeur.
        this.userRoles = await loadUserRoles();
        return;
      }
      const res = await assignUserRole({ ...entry, role_name: roleName });
      if (res.ok) {
        this.userRoles = await loadUserRoles();
        this.showToast("Rôle mis à jour." + this.localNote(), "success");
      } else {
        this.showToast("Échec de la mise à jour" + this.errText(res), "error");
      }
    },

    // Supprime un utilisateur : en prod, supprime le compte d'auth + son rôle ;
    // en local (démo), supprime juste l'attribution de rôle.
    async removeUser(entry) {
      // Garde-fou : ne pas retirer le DERNIER super admin.
      if (entry.role_name === "super_admin" && this.superAdminCount() <= 1) {
        this.showToast(
          "Impossible de supprimer le dernier super administrateur.",
          "error",
        );
        return;
      }
      if (!confirm("Supprimer définitivement le compte de " + entry.email + " ?")) return;
      this.busy = true;
      const res = this.isLocalMode
        ? await removeUserRole(entry.id)
        : await deleteUser(entry.email);
      this.busy = false;
      if (res.ok) {
        this.userRoles = await loadUserRoles();
        this.showToast("Utilisateur supprimé.", "success");
      } else {
        this.showToast("Échec" + this.errText(res), "error");
      }
    },

    // ---------- Mon compte (libre-service) ----------
    async saveProfile() {
      const f = this.profileForm;
      if (f.password && f.password.length < 8) {
        this.showToast("Le mot de passe doit faire au moins 8 caractères.", "error");
        return;
      }
      if (f.password && f.password !== f.password2) {
        this.showToast("Les deux mots de passe ne correspondent pas.", "error");
        return;
      }
      this.busy = true;
      const res = await updateMyProfile({
        displayName: f.displayName.trim(),
        password: f.password || undefined,
      });
      this.busy = false;
      if (res.ok) {
        if (res.user) this.authUser = res.user;
        this.profileForm.password = "";
        this.profileForm.password2 = "";
        this.showToast("Profil mis à jour.", "success");
      } else {
        this.showToast("Échec" + this.errText(res), "error");
      }
    },

    myEmail() {
      return this.authUser?.email || this.devCreds?.user || "";
    },

    // ---------- Édition articles / solutions ----------
    startCreate(coll) {
      this.editColl = coll;
      this.editItem = coll === "articles" ? blankArticle() : blankSolution();
      this.componentsText = "";
    },

    startEdit(coll, item) {
      this.editColl = coll;
      this.editItem = JSON.parse(JSON.stringify(item));
      this.componentsText =
        coll === "solutions" && Array.isArray(item.components)
          ? item.components.join("\n")
          : "";
    },

    cancelEdit() {
      this.editColl = null;
      this.editItem = null;
      this.componentsText = "";
    },

    async saveEdit() {
      const coll = this.editColl;
      const item = { ...this.editItem };
      if (coll === "solutions") {
        item.maxWatts = Number(item.maxWatts) || 0;
        item.maxDailyWh = Number(item.maxDailyWh) || 0;
        item.components = this.componentsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!item.title && !item.name) {
        this.showToast("Le titre / nom est obligatoire.", "error");
        return;
      }
      this.busy = true;
      const res = await saveContent(coll, item);
      this.busy = false;
      if (res.ok) {
        this.cancelEdit();
        await this.loadAll();
        this.showToast("Enregistré." + this.localNote(), "success");
      } else {
        this.showToast("Échec de l'enregistrement" + this.errText(res), "error");
      }
    },

    async remove(coll, id) {
      if (!confirm("Supprimer définitivement cet élément ?")) return;
      const res = await removeContent(coll, id);
      if (res.ok) {
        await this.loadAll();
        this.showToast("Supprimé." + this.localNote(), "success");
      } else {
        this.showToast("Échec de la suppression" + this.errText(res), "error");
      }
    },

    // ---------- Avis ----------
    async setApproved(review, approved) {
      const res = await saveContent("reviews", { ...review, approved });
      if (res.ok) {
        await this.loadAll();
        this.showToast(
          approved ? "Avis publié." : "Avis masqué.",
          "success",
        );
      } else {
        this.showToast("Action impossible" + this.errText(res), "error");
      }
    },

    // ---------- Utilitaires ----------
    localNote() {
      return this.isLocalMode ? " (enregistré localement)" : "";
    },

    // Extrait un message d'erreur lisible (Supabase, fetch, etc.).
    errText(res) {
      const e = res && res.error;
      if (!e) return "";
      const msg = typeof e === "string" ? e : e.message || JSON.stringify(e);
      return " — " + msg;
    },

    stars(n) {
      return "★".repeat(n) + "☆".repeat(5 - n);
    },

    showToast(message, type = "success") {
      this.toast = { show: true, message, type };
      setTimeout(() => {
        this.toast.show = false;
      }, 3000);
    },
  };
}

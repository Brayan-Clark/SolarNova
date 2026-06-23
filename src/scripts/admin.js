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

    // --- Édition rôle / utilisateur ---
    roleEdit: null, // rôle en cours d'édition
    createForm: { email: "", password: "", role_name: "" },

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
        this.showToast("Échec de l'enregistrement du rôle.", "error");
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
        this.showToast("Échec de la suppression.", "error");
      }
    },

    // ---------- Utilisateurs ----------
    // Crée un compte (email + mot de passe + rôle).
    async createAccount() {
      const email = this.createForm.email.trim().toLowerCase();
      if (!email || !this.createForm.role_name) {
        this.showToast("Email et rôle requis.", "error");
        return;
      }
      if (!this.isLocalMode && !this.createForm.password) {
        this.showToast("Mot de passe requis.", "error");
        return;
      }
      this.busy = true;
      const res = await createUser({
        email,
        password: this.createForm.password,
        role_name: this.createForm.role_name,
      });
      this.busy = false;
      if (res.ok) {
        this.createForm = { email: "", password: "", role_name: "" };
        this.userRoles = await loadUserRoles();
        this.showToast(
          this.isLocalMode
            ? "Utilisateur simulé ajouté (local)."
            : "Compte créé. La personne peut se connecter avec son email + mot de passe.",
          "success",
        );
      } else {
        this.showToast(res.error || "Échec de la création.", "error");
      }
    },

    // Change le rôle d'un utilisateur existant.
    async changeUserRole(entry, roleName) {
      const res = await assignUserRole({ ...entry, role_name: roleName });
      if (res.ok) {
        this.userRoles = await loadUserRoles();
        this.showToast("Rôle mis à jour." + this.localNote(), "success");
      } else {
        this.showToast("Échec de la mise à jour.", "error");
      }
    },

    // Supprime un utilisateur (compte + accès en prod ; accès local sinon).
    async removeUser(entry) {
      if (
        !confirm(
          "Supprimer définitivement le compte et l'accès de " +
            entry.email +
            " ?",
        )
      )
        return;
      const res = this.isLocalMode
        ? await removeUserRole(entry.id)
        : await deleteUser(entry.email);
      if (res.ok) {
        this.userRoles = await loadUserRoles();
        this.showToast("Utilisateur supprimé.", "success");
      } else {
        this.showToast(res.error || "Échec de la suppression.", "error");
      }
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
        this.showToast("Échec de l'enregistrement.", "error");
      }
    },

    async remove(coll, id) {
      if (!confirm("Supprimer définitivement cet élément ?")) return;
      const res = await removeContent(coll, id);
      if (res.ok) {
        await this.loadAll();
        this.showToast("Supprimé." + this.localNote(), "success");
      } else {
        this.showToast("Échec de la suppression.", "error");
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
        this.showToast("Action impossible.", "error");
      }
    },

    // ---------- Utilitaires ----------
    localNote() {
      return this.isLocalMode ? " (enregistré localement)" : "";
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

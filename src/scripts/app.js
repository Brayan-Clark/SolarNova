// ============================================================
//  Logique applicative SolarNova (Alpine.js)
//  Repris de l'ancien index.html, + intégration Supabase.
// ============================================================
import {
    fetchReviews,
    insertReview,
    insertContact,
    insertQuote,
    insertNewsletter,
    isSupabaseConfigured,
    turnstileSiteKey,
    DB_OFFLINE_MESSAGE,
} from "../lib/db.js";
import { listContent } from "../lib/content.js";
import { solutionsSeed, articlesSeed, reviewsSeed } from "../data/seed.js";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import { gfmHeadingId } from "marked-gfm-heading-id";
import katex from "katex";
import hljs from "highlight.js";

// Configuration de marked avec les plugins
marked.use(
    markedHighlight({
        langPrefix: "hljs language-",
        highlight(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : "plaintext";
            return hljs.highlight(code, { language }).value;
        },
    })
);
marked.use(gfmHeadingId());

export function createApp() {
    return {
        // État navigation
        page: "home",
        pageLeaving: false,
        mobileMenu: false,
        scrolled: false,
        newsletterEmail: "",

        // État blog
        blogArticle: null,

        // Filtres
        solutionFilter: "all",
        appCategory: "all",
        reviewFilter: "all",

        // Calculateur
        selectedAppliances: [],
        showCustomForm: false,
        customApp: { name: "", watts: null, qty: 1, hours: 4 },

        // Formulaires
        reviewForm: {
            name: "",
            solution: "",
            rating: 0,
            comment: "",
        },
        contactForm: {
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
        },
        contactSent: false,

        // Devis transmis depuis le calculateur vers le contact
        // (corrige le fait que les choix n'étaient pas conservés)
        pendingQuote: null,

        // Indique si la base Supabase est connectée (pour l'UI)
        dbConfigured: isSupabaseConfigured,

        // Anti-bot Turnstile (actif seulement si une clé est fournie)
        turnstileEnabled: Boolean(turnstileSiteKey),

        // Toast
        toast: { show: false, message: "", type: "success" },

        // Stats animées
        displayStats: { projects: 0, clients: 0, kw: 0, years: 0 },
        statsData: [
            {
                key: "projects",
                label: "Projets réalisés",
                suffix: "+",
                target: 450,
            },
            {
                key: "clients",
                label: "Clients satisfaits",
                suffix: "+",
                target: 320,
            },
            {
                key: "kw",
                label: "kWc installés",
                suffix: "",
                target: 850,
            },
            {
                key: "years",
                label: "Années d'expérience",
                suffix: "+",
                target: 8,
            },
        ],

        // Navigation
        navLinks: [
            { id: "home", label: "Accueil" },
            { id: "solutions", label: "Solutions" },
            { id: "calculateur", label: "Calculateur" },
            { id: "blog", label: "Blog" },
            { id: "avis", label: "Avis" },
            { id: "apropos", label: "À Propos" },
            { id: "contact", label: "Contact" },
        ],

        // Features
        features: [
            {
                icon: "fa-solid fa-certificate",
                title: "Expertise Certifiée",
                desc: "Nos techniciens sont formés et certifiés par les principaux fabricants d'équipements solaires.",
            },
            {
                icon: "fa-solid fa-microchip",
                title: "Matériel Premium",
                desc: "Nous sélectionnons rigoureusement des panneaux, batteries et onduleurs des meilleures marques mondiales.",
            },
            {
                icon: "fa-solid fa-wrench",
                title: "Installation Pro",
                desc: "Chaque installation respecte les normes internationales avec des tests complets avant mise en service.",
            },
            {
                icon: "fa-solid fa-headset",
                title: "SAV Réactif",
                desc: "Notre équipe de support intervient rapidement en cas de besoin. Maintenance préventive incluse.",
            },
            {
                icon: "fa-solid fa-calculator",
                title: "Devis Gratuit",
                desc: "Obtenez une estimation détaillée et personnalisée sans aucun engagement de votre part.",
            },
            {
                icon: "fa-solid fa-shield-halved",
                title: "Garantie Étendue",
                desc: "Jusqu'à 25 ans de garantie sur les panneaux et 5 ans sur l'ensemble de l'installation.",
            },
        ],

        // Catégories d'appareils
        applianceCategories: [
            { id: "eclairage", label: "Éclairage" },
            { id: "cuisine", label: "Cuisine" },
            { id: "divertissement", label: "Divertissement" },
            { id: "confort", label: "Confort" },
            { id: "bureau", label: "Bureau" },
            { id: "entretien", label: "Entretien" },
            { id: "utilitaire", label: "Utilitaire" },
        ],

        // Appareils avec consommation
        appliances: [
            {
                id: 1,
                name: "Ampoule LED",
                icon: "fa-solid fa-lightbulb",
                watts: 10,
                category: "eclairage",
            },
            {
                id: 2,
                name: "Tube néon LED",
                icon: "fa-solid fa-lightbulb",
                watts: 18,
                category: "eclairage",
            },
            {
                id: 3,
                name: "Spot extérieur LED",
                icon: "fa-solid fa-lightbulb",
                watts: 15,
                category: "eclairage",
            },
            {
                id: 4,
                name: "Réfrigérateur",
                icon: "fa-solid fa-temperature-low",
                watts: 150,
                category: "cuisine",
            },
            {
                id: 5,
                name: "Cuisinière électrique",
                icon: "fa-solid fa-fire-burner",
                watts: 1000,
                category: "cuisine",
            },
            {
                id: 6,
                name: "Rice Cooker",
                icon: "fa-solid fa-bowl-rice",
                watts: 400,
                category: "cuisine",
            },
            {
                id: 7,
                name: "Micro-ondes",
                icon: "fa-solid fa-wave-square",
                watts: 800,
                category: "cuisine",
            },
            {
                id: 8,
                name: "Mixeur / Blender",
                icon: "fa-solid fa-blender",
                watts: 350,
                category: "cuisine",
            },
            {
                id: 9,
                name: "Bouilloire",
                icon: "fa-solid fa-mug-hot",
                watts: 1500,
                category: "cuisine",
            },
            {
                id: 10,
                name: 'TV LED 32"',
                icon: "fa-solid fa-tv",
                watts: 80,
                category: "divertissement",
            },
            {
                id: 11,
                name: 'TV LED 55"',
                icon: "fa-solid fa-tv",
                watts: 120,
                category: "divertissement",
            },
            {
                id: 12,
                name: "Décodeur TV",
                icon: "fa-solid fa-satellite-dish",
                watts: 25,
                category: "divertissement",
            },
            {
                id: 13,
                name: "Radio / Récepteur",
                icon: "fa-solid fa-radio",
                watts: 20,
                category: "divertissement",
            },
            {
                id: 14,
                name: "Chargeur téléphone",
                icon: "fa-solid fa-mobile-screen",
                watts: 15,
                category: "divertissement",
            },
            {
                id: 15,
                name: "Ventilateur",
                icon: "fa-solid fa-fan",
                watts: 65,
                category: "confort",
            },
            {
                id: 16,
                name: "Climatiseur 1.5 CV",
                icon: "fa-solid fa-snowflake",
                watts: 1500,
                category: "confort",
            },
            {
                id: 17,
                name: "Chauffe-eau",
                icon: "fa-solid fa-shower",
                watts: 2000,
                category: "confort",
            },
            {
                id: 18,
                name: "Ordinateur portable",
                icon: "fa-solid fa-laptop",
                watts: 60,
                category: "bureau",
            },
            {
                id: 19,
                name: "Ordinateur de bureau",
                icon: "fa-solid fa-desktop",
                watts: 250,
                category: "bureau",
            },
            {
                id: 20,
                name: "Imprimante",
                icon: "fa-solid fa-print",
                watts: 50,
                category: "bureau",
            },
            {
                id: 21,
                name: "Routeur WiFi",
                icon: "fa-solid fa-wifi",
                watts: 12,
                category: "bureau",
            },
            {
                id: 22,
                name: "Machine à laver",
                icon: "fa-solid fa-shirt",
                watts: 800,
                category: "entretien",
            },
            {
                id: 23,
                name: "Fer à repasser",
                icon: "fa-solid fa-temperature-high",
                watts: 1200,
                category: "entretien",
            },
            {
                id: 24,
                name: "Sèche-cheveux",
                icon: "fa-solid fa-wind",
                watts: 1500,
                category: "entretien",
            },
            {
                id: 25,
                name: "Pompe à eau",
                icon: "fa-solid fa-faucet-drip",
                watts: 750,
                category: "utilitaire",
            },
            {
                id: 26,
                name: "Outil électrique",
                icon: "fa-solid fa-screwdriver-wrench",
                watts: 500,
                category: "utilitaire",
            },
            {
                id: 27,
                name: "Alarme sécurité",
                icon: "fa-solid fa-bell",
                watts: 10,
                category: "utilitaire",
            },
            {
                id: 28,
                name: "Caméra surveillance",
                icon: "fa-solid fa-video",
                watts: 15,
                category: "utilitaire",
            },
        ],

        // Solutions
        solutions: [...solutionsSeed],

        // Articles blog
        articles: [...articlesSeed],

        // Avis clients
        reviews: [...reviewsSeed],

        // --- Computed ---
        get filteredAppliances() {
            if (this.appCategory === "all") return this.appliances;
            return this.appliances.filter(
                (a) => a.category === this.appCategory,
            );
        },
        get filteredSolutions() {
            if (this.solutionFilter === "all")
                return this.solutions;
            return this.solutions.filter(
                (s) => s.tier === this.solutionFilter,
            );
        },
        get filteredReviews() {
            if (this.reviewFilter === "all") return this.reviews;
            return this.reviews.filter(
                (r) => r.solution === this.reviewFilter,
            );
        },
        get totalPeakWatts() {
            return this.selectedAppliances.reduce(
                (s, a) => s + a.watts * a.qty,
                0,
            );
        },
        get totalDailyWh() {
            return this.selectedAppliances.reduce(
                (s, a) => s + a.watts * a.qty * a.hours,
                0,
            );
        },
        get totalMonthlyKWh() {
            return Math.round((this.totalDailyWh * 30) / 1000);
        },
        get consumptionPercent() {
            return Math.min((this.totalDailyWh / 20000) * 100, 100);
        },
        get suggestedKit() {
            if (!this.selectedAppliances.length) return null;
            const sorted = [...this.solutions].sort(
                (a, b) => a.maxDailyWh - b.maxDailyWh,
            );
            return (
                sorted.find(
                    (s) =>
                        s.maxDailyWh >= this.totalDailyWh &&
                        s.maxWatts >= this.totalPeakWatts,
                ) || sorted[sorted.length - 1]
            );
        },
        get avgRating() {
            if (!this.reviews.length) return 0;
            return (
                this.reviews.reduce((s, r) => s + r.rating, 0) /
                this.reviews.length
            ).toFixed(1);
        },

        // --- Méthodes ---
        init() {
            // Contenu (solutions, articles, avis) depuis la couche
            // de contenu : Supabase si configuré, sinon localStorage
            // (seedé depuis les défauts). Reflète les modifs admin.
            this.loadContent();
            this.loadReviews();
            this.page = location.hash.slice(1) || "home";
            window.addEventListener("hashchange", () => {
                this.page = location.hash.slice(1) || "home";
            });
            window.addEventListener("scroll", () => {
                this.scrolled = window.scrollY > 50;
            });
            // Préchargeur
            setTimeout(() => {
                document
                    .getElementById("preloader")
                    .classList.add("hide");
                setTimeout(
                    () =>
                        document
                            .getElementById("preloader")
                            .remove(),
                    600,
                );
            }, 800);
            // Particules
            this.initParticles();
            // Animation stats
            this.$nextTick(() => this.observeStats());
        },

        navigate(page) {
            if (this.page === page) return;
            this.pageLeaving = true;
            this.mobileMenu = false;
            this.blogArticle = null;
            setTimeout(() => {
                this.page = page;
                this.pageLeaving = false;
                window.scrollTo({ top: 0, behavior: "smooth" });
                history.pushState(null, "", "#" + page);
                if (page === "home")
                    this.$nextTick(() => this.observeStats());
            }, 200);
        },

        observeStats() {
            const el = document.getElementById("stats-section");
            if (!el) return;
            const obs = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        this.animateCounters();
                        obs.disconnect();
                    }
                },
                { threshold: 0.3 },
            );
            obs.observe(el);
        },

        animateCounters() {
            const duration = 2000;
            const start = Date.now();
            const targets = {
                projects: 450,
                clients: 320,
                kw: 850,
                years: 8,
            };
            const tick = () => {
                const p = Math.min(
                    (Date.now() - start) / duration,
                    1,
                );
                const e = 1 - Math.pow(1 - p, 3);
                this.displayStats = {
                    projects: Math.round(targets.projects * e),
                    clients: Math.round(targets.clients * e),
                    kw: Math.round(targets.kw * e),
                    years: Math.round(targets.years * e),
                };
                if (p < 1) requestAnimationFrame(tick);
            };
            this.displayStats = {
                projects: 0,
                clients: 0,
                kw: 0,
                years: 0,
            };
            tick();
        },

        isSelected(id) {
            return this.selectedAppliances.some((a) => a.id === id);
        },

        toggleAppliance(app) {
            if (this.isSelected(app.id)) {
                this.selectedAppliances =
                    this.selectedAppliances.filter(
                        (a) => a.id !== app.id,
                    );
            } else {
                this.selectedAppliances.push({
                    id: app.id,
                    name: app.name,
                    icon: app.icon,
                    watts: app.watts,
                    qty: 1,
                    hours: 4,
                });
            }
        },

        addCustomAppliance() {
            if (
                !this.customApp.name ||
                !this.customApp.watts ||
                this.customApp.watts <= 0
            ) {
                this.showToast(
                    "Veuillez remplir le nom et la consommation en watts.",
                    "error",
                );
                return;
            }
            this.selectedAppliances.push({
                id: Date.now(),
                name: this.customApp.name,
                icon: "fa-solid fa-plug",
                watts: Math.round(this.customApp.watts),
                qty: Math.max(1, this.customApp.qty || 1),
                hours: Math.max(0.5, this.customApp.hours || 1),
            });
            this.customApp = {
                name: "",
                watts: null,
                qty: 1,
                hours: 4,
            };
            this.showCustomForm = false;
            this.showToast(
                "Appareil ajouté avec succès.",
                "success",
            );
        },

        openArticle(article) {
            this.blogArticle = article;
            window.scrollTo({ top: 0, behavior: "smooth" });
        },

        // Affiche le contenu d'un article.
        // - S'il commence par une balise HTML → ancien format HTML,
        //   rendu tel quel (rétrocompatibilité).
        // - Sinon → interprété comme du Markdown avec support LaTeX.
        renderArticle(content) {
            if (!content) return "";
            if (/^\s*</.test(content)) {
                // Pour l'ancien format HTML, on traite aussi les formules LaTeX
                return this.renderMath(content);
            }
            const html = marked.parse(content, { breaks: true });
            return this.renderMath(html);
        },

        // Traite les formules LaTeX dans le contenu HTML
        renderMath(html) {
            // Remplacer les formules entre $$ (display math)
            html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
                try {
                    return katex.renderToString(formula.trim(), {
                        displayMode: true,
                        throwOnError: false,
                    });
                } catch (e) {
                    return match;
                }
            });
            // Remplacer les formules entre $ (inline math)
            html = html.replace(/\$([^$]+)\$/g, (match, formula) => {
                try {
                    return katex.renderToString(formula.trim(), {
                        displayMode: false,
                        throwOnError: false,
                    });
                } catch (e) {
                    return match;
                }
            });
            return html;
        },

        // Récupère le token Turnstile d'un widget (par id d'élément).
        // Renvoie : "" si pas de token, null si Turnstile désactivé.
        turnstileToken(id) {
            if (!this.turnstileEnabled) return null;
            const el = document.getElementById(id);
            if (!window.turnstile || !el) return "";
            try {
                return window.turnstile.getResponse(el) || "";
            } catch {
                return "";
            }
        },

        resetTurnstile(id) {
            const el = document.getElementById(id);
            if (this.turnstileEnabled && window.turnstile && el) {
                try {
                    window.turnstile.reset(el);
                } catch {
                    /* widget pas encore monté : on ignore */
                }
            }
        },

        // Charge solutions + articles depuis la couche de contenu.
        async loadContent() {
            try {
                const [sols, arts] = await Promise.all([
                    listContent("solutions"),
                    listContent("articles"),
                ]);
                if (sols && sols.length) this.solutions = sols;
                if (arts && arts.length) this.articles = arts;
            } catch {
                // on garde les données par défaut en cas d'erreur
            }
        },

        // Charge les avis approuvés (Supabase ou localStorage).
        async loadReviews() {
            const res = await fetchReviews();
            if (res.ok && res.data.length) {
                this.reviews = res.data;
            }
            // erreur : on conserve les avis seed locaux
        },

        async submitReview() {
            const f = this.reviewForm;
            if (!f.name || !f.solution || !f.rating || !f.comment) {
                this.showToast(
                    "Veuillez remplir tous les champs du formulaire.",
                    "error",
                );
                return;
            }
            // Anti-bot : on exige une validation Turnstile si activé
            const token = this.turnstileToken("ts-review");
            if (this.turnstileEnabled && !token) {
                this.showToast(
                    "Veuillez valider le test anti-robot.",
                    "error",
                );
                return;
            }
            const review = {
                name: f.name,
                solution: f.solution,
                rating: f.rating,
                comment: f.comment,
            };
            // Affichage optimiste immédiat
            this.reviews.unshift({
                ...review,
                date: new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                }),
            });
            this.reviewForm = {
                name: "",
                solution: "",
                rating: 0,
                comment: "",
            };
            // Persistance (best-effort)
            const res = await insertReview(review, token);
            this.resetTurnstile("ts-review");
            if (res.ok) {
                this.showToast(
                    "Merci pour votre avis ! Il sera publié après validation.",
                    "success",
                );
            } else if (res.offline) {
                this.showToast(
                    "Avis affiché localement. " + DB_OFFLINE_MESSAGE,
                    "success",
                );
            } else {
                this.showToast(
                    "Avis affiché, mais l'enregistrement a échoué.",
                    "error",
                );
            }
        },

        // Demande de devis depuis une carte Solution : pré-remplit
        // le sujet du contact avec la solution choisie.
        requestSolution(s) {
            // Demande de devis → on présélectionne l'option "devis"
            this.contactForm.subject = "devis";
            this.contactForm.message =
                "Bonjour, je suis intéressé(e) par la solution « " +
                (s?.name || "") +
                " ». Merci de me recontacter.";
            this.navigate("contact");
        },

        // Appelé depuis le calculateur : conserve les choix de
        // l'utilisateur (appareils + kit recommandé), pré-remplit
        // le formulaire de contact, puis redirige vers Contact.
        requestQuote() {
            if (!this.selectedAppliances.length) {
                this.showToast(
                    "Ajoutez au moins un appareil avant de demander un devis.",
                    "error",
                );
                return;
            }
            const kit = this.suggestedKit
                ? this.suggestedKit.name
                : "À déterminer";
            const lignes = this.selectedAppliances
                .map(
                    (a) =>
                        `- ${a.qty}× ${a.name} (${a.watts} W, ${a.hours} h/j)`,
                )
                .join("\n");
            // On sait déjà que c'est une demande de devis → on
            // sélectionne directement l'option correspondante.
            this.contactForm.subject = "devis";
            this.contactForm.message =
                "Bonjour, suite au calculateur voici mon besoin :\n\n" +
                lignes +
                "\n\nConsommation estimée : " +
                this.totalPeakWatts +
                " W de pic, " +
                this.totalDailyWh.toLocaleString() +
                " Wh/jour, " +
                this.totalMonthlyKWh +
                " kWh/mois.\nKit recommandé : " +
                kit +
                ".\n\nMerci de me recontacter pour une étude détaillée.";
            // Devis structuré conservé pour enregistrement à l'envoi
            this.pendingQuote = {
                appliances: this.selectedAppliances.map((a) => ({
                    name: a.name,
                    watts: a.watts,
                    qty: a.qty,
                    hours: a.hours,
                })),
                totalPeakWatts: this.totalPeakWatts,
                totalDailyWh: this.totalDailyWh,
                totalMonthlyKWh: this.totalMonthlyKWh,
                suggestedKit: kit,
            };
            this.navigate("contact");
        },

        async submitContact() {
            const f = this.contactForm;
            if (!f.name || !f.email || !f.subject || !f.message) {
                this.showToast(
                    "Veuillez remplir tous les champs obligatoires.",
                    "error",
                );
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
                this.showToast(
                    "Veuillez entrer une adresse email valide.",
                    "error",
                );
                return;
            }
            // Limite de longueur (évite les erreurs et le spam)
            if (f.message.length > 4000) {
                this.showToast(
                    "Message trop long (4000 caractères max). Merci de le raccourcir.",
                    "error",
                );
                return;
            }
            // Anti-bot : on exige une validation Turnstile si activé
            const token = this.turnstileToken("ts-contact");
            if (this.turnstileEnabled && !token) {
                this.showToast(
                    "Veuillez valider le test anti-robot.",
                    "error",
                );
                return;
            }
            // Enregistrement du message de contact
            const res = await insertContact(f, token);
            this.resetTurnstile("ts-contact");

            // En cas d'échec : PAS de confirmation, on montre la vraie erreur.
            if (!res.ok) {
                this.showToast(
                    "Échec de l'envoi" + this.errMsg(res),
                    "error",
                );
                return;
            }

            // Succès : on enregistre le devis éventuel, puis on confirme.
            if (this.pendingQuote) {
                await insertQuote(
                    {
                        ...this.pendingQuote,
                        contactName: f.name,
                        contactEmail: f.email,
                        contactPhone: f.phone,
                    },
                    token,
                );
                this.pendingQuote = null;
            }
            this.contactSent = true;
            this.showToast(
                res.local
                    ? "Message reçu (enregistré localement)."
                    : "Message envoyé avec succès !",
                "success",
            );
        },

        // Extrait un message d'erreur lisible (Supabase, fetch…).
        errMsg(res) {
            const e = res && res.error;
            if (!e) return ".";
            const msg =
                typeof e === "string"
                    ? e
                    : e.message || JSON.stringify(e);
            return " — " + msg;
        },

        // Inscription à la newsletter (footer).
        async subscribeNewsletter() {
            const email = (this.newsletterEmail || "").trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                this.showToast(
                    "Veuillez entrer une adresse email valide.",
                    "error",
                );
                return;
            }
            const res = await insertNewsletter(email);
            if (res.ok) {
                this.newsletterEmail = "";
                this.showToast(
                    res.already
                        ? "Vous êtes déjà inscrit(e) !"
                        : "Inscription confirmée !",
                    "success",
                );
            } else {
                this.showToast(
                    "Inscription impossible" + this.errMsg(res),
                    "error",
                );
            }
        },

        showToast(message, type) {
            this.toast = { show: true, message, type };
            setTimeout(() => {
                this.toast.show = false;
            }, 3500);
        },

        initParticles() {
            const canvas =
                document.getElementById("particles-canvas");
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            let particles = [];
            const resize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            resize();
            window.addEventListener("resize", resize);
            // Créer des particules
            for (let i = 0; i < 45; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 1.8 + 0.4,
                    vy: -(Math.random() * 0.25 + 0.08),
                    vx: (Math.random() - 0.5) * 0.15,
                    o: Math.random() * 0.35 + 0.05,
                    pulse: Math.random() * Math.PI * 2,
                });
            }
            let rafId = null;
            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach((p) => {
                    p.y += p.vy;
                    p.x += p.vx;
                    p.pulse += 0.02;
                    if (p.y < -10) {
                        p.y = canvas.height + 10;
                        p.x = Math.random() * canvas.width;
                    }
                    if (p.x < -10) p.x = canvas.width + 10;
                    if (p.x > canvas.width + 10) p.x = -10;
                    const opacity =
                        p.o * (0.7 + 0.3 * Math.sin(p.pulse));
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,179,74,${opacity})`;
                    ctx.fill();
                });
                rafId = requestAnimationFrame(animate);
            };
            animate();
            // Économie de ressources : on met l'animation en pause
            // quand l'onglet n'est pas visible.
            document.addEventListener("visibilitychange", () => {
                if (document.hidden) {
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = null;
                } else if (!rafId) {
                    animate();
                }
            });
        },
    };
}

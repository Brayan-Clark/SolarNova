import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// --- Configuration GitHub Pages ---------------------------------
// Pour un déploiement sur GitHub Pages "projet" (URL du type
// https://<utilisateur>.github.io/<depot>/), il faut renseigner :
//   - site : l'origine github.io
//   - base : "/<nom-du-depot>"
// On les lit depuis des variables d'env pour ne rien coder en dur.
// En local (npm run dev) elles sont absentes → base "/" par défaut.
// Si tu utilises un domaine personnalisé OU une page "utilisateur"
// (<utilisateur>.github.io), laisse SITE défini et BASE vide.
const SITE = process.env.SITE; // ex. https://moncompte.github.io
const BASE = process.env.BASE; // ex. /SolarNova

// https://astro.build/config
export default defineConfig({
  ...(SITE ? { site: SITE } : {}),
  ...(BASE ? { base: BASE } : {}),
  integrations: [
    tailwind({
      // On garde notre propre base CSS (reset + styles custom) : pas d'injection auto.
      applyBaseStyles: false,
    }),
  ],
});

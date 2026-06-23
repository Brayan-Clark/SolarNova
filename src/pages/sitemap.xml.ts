import type { APIRoute } from "astro";

// Sitemap minimal généré au build. Le site est mono-page (navigation
// par ancres), il n'y a donc qu'une URL canonique. Les URLs absolues
// ne sont correctes que si la variable SITE est définie au build.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL || "/";
  const loc = site ? new URL(base, site).href : base;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

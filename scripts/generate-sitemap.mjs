// Regenerates public/sitemap.xml — static routes plus one entry per
// published project (fetched from Sanity so it never drifts from the CMS).
// Runs as a `prebuild` step (see package.json) so every deploy ships an
// up-to-date sitemap without anyone remembering to touch it by hand.
//
// Usage:
//   node --env-file=.env scripts/generate-sitemap.mjs
//
// Only needs VITE_SANITY_PROJECT_ID/VITE_SANITY_DATASET (read-only) — no
// write token required. If the Sanity fetch fails (e.g. no network in a
// sandboxed build), falls back to writing just the static routes rather
// than failing the build.

import { createClient } from '@sanity/client'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://latimer.studio'

const BUILD_DATE = new Date().toISOString().slice(0, 10)

const STATIC_ROUTES = [
  { path: '/', changefreq: 'weekly', priority: '1.0', lastmod: BUILD_DATE },
  { path: '/about', changefreq: 'monthly', priority: '0.7', lastmod: BUILD_DATE },
  { path: '/contact', changefreq: 'monthly', priority: '0.7', lastmod: BUILD_DATE },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3', lastmod: BUILD_DATE },
]

async function fetchProjectSlugs() {
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  const dataset = process.env.VITE_SANITY_DATASET || 'production'
  if (!projectId) {
    console.warn('generate-sitemap: VITE_SANITY_PROJECT_ID not set — skipping project URLs')
    return []
  }

  const client = createClient({ projectId, dataset, apiVersion: '2025-01-01', useCdn: true })
  try {
    return await client.fetch(`*[_type == "project"]{ "id": slug.current, _updatedAt }`)
  } catch (err) {
    console.warn('generate-sitemap: failed to fetch projects, skipping project URLs —', err.message)
    return []
  }
}

function buildXml(routes) {
  const urls = routes
    .map(
      ({ path: routePath, changefreq, priority, lastmod }) => `  <url>
    <loc>${SITE_URL}${routePath}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

const projects = await fetchProjectSlugs()
const projectRoutes = projects
  .filter((p) => p.id)
  .map((p) => ({
    path: `/projects/${p.id}`,
    changefreq: 'monthly',
    priority: '0.8',
    lastmod: p._updatedAt ? p._updatedAt.slice(0, 10) : BUILD_DATE,
  }))

const xml = buildXml([...STATIC_ROUTES, ...projectRoutes])
const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml')
await writeFile(outPath, xml)
console.log(`generate-sitemap: wrote ${STATIC_ROUTES.length + projectRoutes.length} URLs to public/sitemap.xml`)

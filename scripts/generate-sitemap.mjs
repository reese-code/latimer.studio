// Regenerates public/sitemap.xml from the routes in src/App.jsx plus the
// published service / project / article documents in Sanity. Runs as the
// `prebuild` step (see package.json), so every deploy ships a current sitemap.
//
// Usage:
//   npm run sitemap
//   (locally the script loads .env itself; Netlify injects the vars)
//
// Only needs VITE_SANITY_PROJECT_ID/VITE_SANITY_DATASET (read-only, no
// token). Drafts are never returned without a token, so only published
// documents are listed. If the Sanity fetch fails, falls back to just the
// static routes rather than failing the build.
//
// Rules: canonical https://latimer.studio URLs with no trailing slash (matches
// setCanonical in src/lib/documentHead.js); no /studio, 404, or noindexed
// pages; <lastmod> only (Google ignores changefreq/priority).

import { createClient } from '@sanity/client'
import { execFileSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SITE_URL = 'https://latimer.studio'

if (existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'))

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Static routes from src/App.jsx, each with the page file whose last commit
// date becomes <lastmod>. Left out on purpose: /studio/* (private CMS),
// /privacy-policy is kept (indexable), `*` (404, noindex).
const STATIC_ROUTES = [
  { path: '/', file: 'src/pages/HomePage.jsx' },
  { path: '/about', file: 'src/pages/AboutPage.jsx' },
  { path: '/cinema', file: 'src/pages/CinemaPage.jsx' },
  { path: '/projects', file: 'src/pages/ProjectsPage.jsx' },
  { path: '/services', file: 'src/pages/ServicesPage.jsx' },
  { path: '/contact', file: 'src/pages/ContactPage.jsx' },
  { path: '/info', file: 'src/pages/InfoPage.jsx' },
  { path: '/privacy-policy', file: 'src/pages/PrivacyPolicyPage.jsx' },
]

function fileLastmod(file) {
  const abs = path.join(ROOT, file)
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: ROOT, encoding: 'utf8' }).trim()
    if (out) return out.slice(0, 10)
  } catch {
    // not a git checkout — fall through to mtime
  }
  return statSync(abs).mtime.toISOString().slice(0, 10)
}

async function fetchDynamic() {
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  const dataset = process.env.VITE_SANITY_DATASET || 'production'
  if (!projectId) {
    console.warn('generate-sitemap: VITE_SANITY_PROJECT_ID not set — skipping dynamic URLs')
    return []
  }

  const client = createClient({ projectId, dataset, apiVersion: '2025-01-01', useCdn: false })
  try {
    const [services, projects, articles] = await Promise.all([
      client.fetch(`*[_type == "service"]{ "slug": slug.current, _updatedAt }`),
      client.fetch(`*[_type == "project"]{ "slug": slug.current, _updatedAt }`),
      // article-mock-* are placeholder docs (see scripts/mock-articles.mjs)
      client.fetch(`*[_type == "article" && !(_id match "article-mock-*")]{ "slug": slug.current, _updatedAt }`),
    ])
    return [
      ...collect('/services', services),
      ...collect('/projects', projects),
      ...collect('/info', articles),
    ]
  } catch (err) {
    console.warn('generate-sitemap: Sanity fetch failed, skipping dynamic URLs —', err.message)
    return []
  }
}

function collect(prefix, docs) {
  const out = []
  for (const d of docs || []) {
    if (!d.slug || !SLUG_RE.test(d.slug)) {
      console.warn(`generate-sitemap: skipped ${prefix}/${JSON.stringify(d.slug)} — empty or invalid slug`)
      continue
    }
    out.push({ path: `${prefix}/${d.slug}`, lastmod: d._updatedAt.slice(0, 10) })
  }
  return out
}

function buildXml(routes) {
  const urls = routes
    .map(
      ({ path: routePath, lastmod }) => `  <url>
    <loc>${SITE_URL}${routePath === '/' ? '/' : routePath}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

const staticRoutes = STATIC_ROUTES.map((r) => ({ path: r.path, lastmod: fileLastmod(r.file) }))
const routes = [...staticRoutes, ...(await fetchDynamic())]

const seen = new Set()
const unique = routes.filter((r) => !seen.has(r.path) && seen.add(r.path))

await writeFile(path.join(ROOT, 'public', 'sitemap.xml'), buildXml(unique))
console.log(`generate-sitemap: wrote ${unique.length} URLs to public/sitemap.xml`)

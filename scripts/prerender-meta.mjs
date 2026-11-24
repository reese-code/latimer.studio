// Post-build: writes dist/services/index.html and dist/services/<slug>/index.html
// as copies of dist/index.html with the correct <title>, description, canonical
// and Open Graph tags baked in.
//
// Why: the site is a client-rendered SPA and the `/*` rewrite serves the
// homepage HTML (with the homepage canonical) for every URL. Google reads that
// raw HTML first, so service pages looked like duplicates of "/". Netlify
// serves a real file before applying a non-forced rewrite, so these files win.
// The React app still mounts normally and keeps the tags in sync client-side.
//
// Titles/descriptions mirror src/pages/ServicesPage.jsx. Falls back to the
// static list in src/lib/services.js if the Sanity fetch fails.

import { createClient } from '@sanity/client'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const SITE_URL = 'https://latimer.studio'
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

if (existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'))

const DEFAULT_DESC =
  'Custom web design, React development, and branding from Latimer Studio in Denver. See our services, pricing, and past projects.'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

async function fetchServices() {
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  if (!projectId) return []
  try {
    const client = createClient({
      projectId,
      dataset: process.env.VITE_SANITY_DATASET || 'production',
      apiVersion: '2025-01-01',
      useCdn: false,
    })
    return await client.fetch(
      `*[_type == "service"]{ "slug": slug.current, "label": title, metaTitle, metaDescription }`
    )
  } catch (err) {
    console.warn('prerender-meta: Sanity fetch failed —', err.message)
    return []
  }
}

function withMeta(html, { title, description, route }) {
  const url = `${SITE_URL}${route}`
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
}

async function write(route, html) {
  const dir = path.join(DIST, route)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), html)
}

const base = await readFile(path.join(DIST, 'index.html'), 'utf8')
const services = (await fetchServices()).filter((s) => s.slug && SLUG_RE.test(s.slug))

await write('services', withMeta(base, {
  title: 'Services — Latimer Studio Denver Web Design & Branding',
  description: DEFAULT_DESC,
  route: '/services',
}))

for (const s of services) {
  await write(`services/${s.slug}`, withMeta(base, {
    title: s.metaTitle || `${s.label || 'Services'} — Latimer Studio Denver Web Design & Branding`,
    description: s.metaDescription || DEFAULT_DESC,
    route: `/services/${s.slug}`,
  }))
}

console.log(`prerender-meta: wrote /services + ${services.length} service pages to dist/`)

// Post-build: writes dist/<route>/index.html for every indexable route (static
// pages, services, projects, articles) as copies of dist/index.html with the correct <title>, description, canonical
// and Open Graph tags baked in.
//
// Why: the site is a client-rendered SPA and the `/*` rewrite serves the
// homepage HTML (with the homepage canonical) for every URL. Google reads that
// raw HTML first, so service pages looked like duplicates of "/". Netlify
// serves a real file before applying a non-forced rewrite, so these files win.
// The React app still mounts normally and keeps the tags in sync client-side.
//
// Titles/descriptions mirror each page's useDocumentHead call in src/pages/ —
// keep the two in sync. If the Sanity fetch fails, only the static routes
// (with their fallback copy) are written.

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

async function fetchDocs() {
  const empty = { services: [], projects: [], articles: [], about: null, info: null }
  const projectId = process.env.VITE_SANITY_PROJECT_ID
  if (!projectId) return empty
  try {
    const client = createClient({
      projectId,
      dataset: process.env.VITE_SANITY_DATASET || 'production',
      apiVersion: '2025-01-01',
      useCdn: false,
    })
    const [services, projects, articles, about, info] = await Promise.all([
      client.fetch(`*[_type == "service"]{ "slug": slug.current, "label": title, metaTitle, metaDescription }`),
      client.fetch(`*[_type == "project"]{ "slug": slug.current, "label": title, type, tagline, description }`),
      client.fetch(
        `*[_type == "article" && !(_id match "article-mock-*")]{ "slug": slug.current, title, excerpt, subheading }`
      ),
      client.fetch(`*[_type == "aboutPage"][0]{ metaTitle, metaDescription }`),
      client.fetch(`*[_type == "infoPage"][0]{ heading, subheading }`),
    ])
    return { services, projects, articles, about, info }
  } catch (err) {
    console.warn('prerender-meta: Sanity fetch failed —', err.message)
    return empty
  }
}

function withMeta(html, { title, description, route, ogType = 'website', image }) {
  const url = `${SITE_URL}${route}`
  const imageTags = image
    ? `    <meta property="og:image" content="${SITE_URL}${image}" />\n    <meta name="twitter:image" content="${SITE_URL}${image}" />\n  </head>`
    : '</head>'
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1${ogType}$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace('</head>', imageTags)
}

async function write(route, html) {
  const dir = path.join(DIST, route)
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, 'index.html'), html)
}

const base = await readFile(path.join(DIST, 'index.html'), 'utf8')
const { services, projects, articles, about, info } = await fetchDocs()
const ok = (d) => d.slug && SLUG_RE.test(d.slug)

const pages = [
  {
    route: '/about',
    title: about?.metaTitle || 'About Latimer Studio — Denver Web Design & Branding Studio',
    description:
      about?.metaDescription ||
      'Latimer Studio is a Denver-based design studio with 50+ custom sites built across industries, blending UI/UX expertise, React development, and branding.',
  },
  {
    route: '/cinema',
    title: 'Latimer Studio — Cinema Mode',
    description:
      'Latimer Studio is a Denver-based design studio building custom, high-converting websites and brand identities — UI/UX design, React development, and branding for businesses that want to stand out.',
  },
  {
    route: '/projects',
    title: 'Projects — Latimer Studio',
    description:
      'Selected custom websites and brand identities from Latimer Studio, a Denver-based design studio specializing in high-converting e-commerce.',
  },
  {
    route: '/services',
    title: 'Services — Latimer Studio Denver Web Design & Branding',
    description: DEFAULT_DESC,
  },
  {
    route: '/contact',
    title: 'Contact Latimer Studio — Start Your Denver Web Design Project',
    description:
      'Get in touch with Latimer Studio to start a custom website, brand identity, or UI/UX project with our Denver-based design team.',
    image: '/contact-link-card.png',
  },
  {
    route: '/info',
    title: `${info?.heading || 'Web Info'} | Latimer Studio`,
    description:
      info?.subheading ||
      'The only resource you need in order to build a successful website. Each article is researched to help improve conversions.',
  },
  {
    route: '/privacy-policy',
    title: 'Privacy Policy — Latimer Studio',
    description: 'How Latimer Studio collects, uses, and protects your information.',
  },
  ...services.filter(ok).map((s) => ({
    route: `/services/${s.slug}`,
    title: s.metaTitle || `${s.label || 'Services'} — Latimer Studio Denver Web Design & Branding`,
    description: s.metaDescription || DEFAULT_DESC,
  })),
  ...projects.filter(ok).map((p) => ({
    route: `/projects/${p.slug}`,
    title: `${p.label} — ${p.type || 'Case Study'} | Latimer Studio`,
    description: p.tagline || p.description || DEFAULT_DESC,
    ogType: 'article',
  })),
  ...articles.filter(ok).map((a) => ({
    route: `/info/${a.slug}`,
    title: `${a.title} | Latimer Studio`,
    description: a.excerpt || a.subheading || DEFAULT_DESC,
    ogType: 'article',
  })),
]

for (const page of pages) await write(page.route, withMeta(base, page))

console.log(`prerender-meta: wrote ${pages.length} pages to dist/`)

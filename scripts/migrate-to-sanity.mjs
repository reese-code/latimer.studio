// One-time migration: pushes today's hardcoded site content into Sanity so
// the CMS starts pre-populated with everything that currently exists.
//
// Usage:
//   node --env-file=.env scripts/migrate-to-sanity.mjs
//
// Requires VITE_SANITY_PROJECT_ID, VITE_SANITY_DATASET, and a write-capable
// SANITY_WRITE_TOKEN (see .env.example) to be set.

import { createClient } from '@sanity/client'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Mirrors src/data/projects.js — duplicated here (rather than imported)
// because that file imports its poster images the Vite way
// (`import x from './foo.png'`), which plain Node can't resolve.
const PROJECTS = [
  {
    id: 'ciao',
    label: 'Ciao',
    number: '01',
    year: '2024',
    type: 'Brand Identity',
    tags: ['Identity', 'Typography', 'Print'],
    description:
      'A warm, expressive identity rooted in Italian culture and modernist craft. Ciao brings together typographic warmth and considered simplicity.',
  },
  {
    id: 'studioro',
    label: 'Studio Ro',
    number: '02',
    year: '2025',
    type: 'Creative Direction',
    industry: 'Dance',
    category: 'Personal Portfolio',
    date: '2025',
    tagline: 'A dance and creative platform based in Los Angeles',
    siteUrl: '#',
    tags: ['Direction', 'Spatial', 'Graphic'],
    description:
      'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines.',
    overview: [
      'Founded by Rocío Colomer Jordà — a multidisciplinary artist blending technique, Latin rhythm, and powerful feminine energy. Professional dancer, choreographer, instructor, and creative director, brought together under one vision.',
      'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
    ],
    tools: ['GSAP', 'Figma', 'Sanity', 'React'],
    services: ['Branding', 'Strategy', 'UX/UI', 'Web Development'],
    storySections: [
      {
        number: '01',
        title: 'Bringing the studio to the web',
        paragraph:
          'Founded by Rocío Colomer Jordà — a multidisciplinary artist blending technique, Latin rhythm, and powerful feminine energy. Professional dancer, choreographer, instructor, and creative director, brought together under one vision.',
      },
      {
        number: '02',
        title: 'A cinematic approach to movement',
        paragraph:
          'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
      },
      {
        number: '03',
        title: 'Direction across every discipline',
        paragraph:
          'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines — unified by one consistent, considered point of view.',
      },
    ],
    testimonial: {
      name: 'Rocío Colomer Jordà',
      quote:
        'Helping dancers connect with their sensuality, strength, and artistic identity. As a choreographer and creative director, she develops concepts that highlight personality, texture, and a cinematic approach to movement.',
    },
  },
  {
    id: 'forge',
    label: 'Forge',
    number: '03',
    year: '2024',
    type: 'Digital Product',
    tags: ['Product', 'UI/UX', 'Digital'],
    description:
      'A product studio building tools at the intersection of craft and technology. Forge is built for makers who think with their hands.',
  },
]

const projectId = process.env.VITE_SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || 'production'
const token = process.env.SANITY_WRITE_TOKEN

if (!projectId || !token) {
  console.error(
    'Missing VITE_SANITY_PROJECT_ID or SANITY_WRITE_TOKEN. Set them in .env, see .env.example.'
  )
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
})

async function uploadImage(assetPath) {
  const absPath = path.join(__dirname, '..', 'src', 'assets', assetPath)
  const buffer = await readFile(absPath)
  const asset = await client.assets.upload('image', buffer, {
    filename: path.basename(assetPath),
  })
  return { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
}

// Same source assets currently imported by src/data/projects.js.
const POSTER_FILES = {
  ciao: 'ciao_poster.png',
  studioro: 'studioro_poster.png',
  forge: 'forge_poster.png',
}

async function migrateProjects() {
  const posterAssets = {}
  for (const [id, file] of Object.entries(POSTER_FILES)) {
    console.log(`Uploading poster image for "${id}"...`)
    posterAssets[id] = await uploadImage(file)
  }

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i]
    console.log(`Creating project "${p.id}"...`)

    const storySections = p.storySections
      ? await Promise.all(
          p.storySections.map(async (section) => ({
            _key: section.number,
            number: section.number,
            title: section.title,
            paragraph: section.paragraph,
            // storySections in the static data reuse the poster image today.
            image: posterAssets[p.id],
          }))
        )
      : undefined

    await client.createOrReplace({
      _id: `project-${p.id}`,
      _type: 'project',
      title: p.label,
      slug: { _type: 'slug', current: p.id },
      orderRank: i,
      number: p.number,
      year: p.year,
      type: p.type,
      industry: p.industry,
      category: p.category,
      date: p.date,
      tagline: p.tagline,
      siteUrl: p.siteUrl,
      poster: posterAssets[p.id],
      tags: p.tags,
      description: p.description,
      overview: p.overview,
      tools: p.tools,
      services: p.services,
      storySections,
      testimonial: p.testimonial,
    })
  }
}

async function migrateSiteSettings() {
  console.log('Creating siteSettings...')
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    aboutCopy:
      "Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people. We're not building websites; we're breaking the noise in the sea of sameness with world class design and branding.",
    footerTaglines: ['A Creative Studio', 'Based out of Denver', 'Built to standout'],
    contactLinks: [
      { _key: 'x', label: 'X', href: 'https://x.com' },
      { _key: 'instagram', label: 'INSTAGRAM', href: 'https://instagram.com' },
      { _key: 'tele', label: 'TELE: 720-688-8877', href: 'tel:+17206888877' },
      { _key: 'email', label: 'INFO@LATIMER.STUDIO', href: 'mailto:info@latimer.studio' },
      { _key: 'coords', label: '39.73921° N, 104.99030° W', href: null },
    ],
    typeformId: '01KZ2856FA05DPKNF3CW2YF94G',
  })
}

async function migratePrivacyPolicy() {
  console.log('Creating privacyPolicy...')
  await client.createOrReplace({
    _id: 'privacyPolicy',
    _type: 'privacyPolicy',
    title: 'Privacy Policy',
    sections: [
      {
        _key: 'collect',
        title: 'Information We Collect',
        body: 'We collect information you provide directly to us, such as when you reach out through our contact channels, along with basic technical data (like browser type and device info) gathered automatically as you browse this site.',
      },
      {
        _key: 'use',
        title: 'How We Use Information',
        body: 'Information collected is used to respond to inquiries, improve the site experience, and communicate about our work. We do not sell your personal information to third parties.',
      },
      {
        _key: 'cookies',
        title: 'Cookies & Analytics',
        body: 'This site may use cookies and similar technologies to understand how visitors use it. You can control cookies through your browser settings at any time.',
      },
      {
        _key: 'contact',
        title: 'Contact',
        body: 'If you have questions about this policy, reach out at info@latimer.studio.',
      },
    ],
  })
}

async function main() {
  await migrateProjects()
  await migrateSiteSettings()
  await migratePrivacyPolicy()
  console.log('Done. Content is now live in Sanity — edit it at /studio.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

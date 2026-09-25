// Creates 6 mock `article` documents in Sanity for testing the Info page /
// article page / accordion / hover-list interactions. Safe to run more than
// once (uses createOrReplace with deterministic ids `article-mock-N`).
//
// Usage:
//   node --env-file=.env scripts/mock-articles.mjs
//
// Delete afterwards with:
//   node --env-file=.env scripts/delete-mock-articles.mjs

import { createClient } from '@sanity/client'
import { deflateSync } from 'node:zlib'

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

// ---------------------------------------------------------------------------
// Tiny dependency-free solid-color PNG encoder — gives each mock article a
// distinct, real uploadable image asset without needing real artwork or a
// network fetch to a placeholder service.
// ---------------------------------------------------------------------------
let crcTable = null
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function solidColorPng(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type: RGB
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const rowBytes = width * 3
  const raw = Buffer.alloc((rowBytes + 1) * height)
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
    }
  }
  const idat = deflateSync(raw)

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const uploadedAssets = new Map()
async function uploadColorImage(key, width, height, rgb) {
  if (uploadedAssets.has(key)) return uploadedAssets.get(key)
  const buffer = solidColorPng(width, height, rgb)
  const asset = await client.assets.upload('image', buffer, { filename: `${key}.png` })
  const ref = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  uploadedAssets.set(key, ref)
  return ref
}

const LOREM =
  'Great web design starts with clarity, not decoration. Every choice on a page, the type scale, the spacing, the order content appears in, should answer a question the visitor already has before they have to ask it. Studios that skip this step end up polishing a layout that was never solving the right problem in the first place.'

const LONG_LOREM = `${LOREM} ${LOREM} A longer paragraph like this one is exactly the case the accordion's pinned-image behavior is built for: as you scroll through all of this copy, the image beside it should lock to the top of the screen with a little breathing room above it, then release and continue scrolling normally once the text runs out. ${LOREM}`

const ARTICLES = [
  {
    slug: 'how-to-brief-a-designer',
    title: 'How to Brief a Designer',
    subheading: 'Get a better outcome by asking better questions up front.',
    date: '2026-09-20',
    author: 'Reese Latimer',
    color: [114, 47, 55],
    excerpt: 'A short guide to writing a design brief that actually gets you what you want.',
    storyRatio: 'default',
    sections: [
      { number: '01', title: 'Start with the problem, not the pixels', color: [180, 150, 120], paragraph: LOREM },
      { number: '02', title: 'Give references, not orders', color: [90, 110, 130], paragraph: LOREM },
    ],
  },
  {
    slug: 'why-fast-websites-win',
    title: 'Why Fast Websites Win',
    subheading: 'Speed is a feature, not a nice-to-have.',
    date: '2026-09-14',
    author: 'Reese Latimer',
    color: [58, 92, 74],
    excerpt: 'Page speed shapes conversion more than almost anything else you can design.',
    storyRatio: 'half',
    sections: [
      { number: '01', title: 'The one-second rule', color: [70, 60, 130], paragraph: LONG_LOREM },
      { number: '02', title: 'What actually makes a site feel slow', color: [160, 90, 60], paragraph: LOREM },
      { number: '03', title: 'Testing on a real connection', color: [40, 130, 120], paragraph: LOREM },
    ],
  },
  {
    slug: 'seo-basics-for-small-business',
    title: 'SEO Basics for Small Business',
    subheading: 'The handful of things worth doing before anything fancier.',
    date: '2026-09-08',
    author: 'Jordan Ellis',
    color: [40, 70, 100],
    excerpt: 'Skip the tricks. These are the fundamentals that actually move rankings.',
    storyRatio: 'default',
    contentWidth: 'contained',
    sections: [
      { number: '01', title: 'Titles and descriptions first', color: [130, 60, 90], paragraph: LOREM },
      { number: '02', title: 'Structure beats stuffing', color: [70, 130, 60], paragraph: LOREM },
    ],
  },
  {
    slug: 'custom-vs-template-the-real-cost',
    title: 'Custom vs Template: The Real Cost',
    subheading: 'What you are actually paying for either way.',
    date: '2026-08-29',
    author: 'Jordan Ellis',
    color: [150, 100, 40],
    excerpt: 'Templates are cheap up front and expensive later. Here is the math.',
    storyRatio: 'half',
    sections: [
      { number: '01', title: 'The sticker price is a trap', color: [40, 40, 110], paragraph: LOREM },
      { number: '02', title: 'Where template costs hide', color: [120, 40, 40], paragraph: LONG_LOREM },
    ],
  },
  {
    slug: 'choosing-the-right-cms',
    title: 'Choosing the Right CMS',
    subheading: 'Match the tool to who will actually use it.',
    date: '2026-08-19',
    author: 'Reese Latimer',
    color: [80, 40, 120],
    excerpt: 'The best CMS is the one your team keeps using six months from now.',
    storyRatio: 'default',
    contentWidth: 'contained',
    sections: [
      { number: '01', title: 'Ask who edits, not who builds', color: [100, 130, 40], paragraph: LOREM },
      { number: '02', title: 'Structured content ages better', color: [40, 100, 130], paragraph: LOREM },
    ],
  },
  {
    slug: 'web-design-trends-2026',
    title: 'Web Design Trends 2026',
    subheading: 'What is worth adopting, and what is just noise.',
    date: '2026-08-05',
    author: 'Reese Latimer',
    color: [180, 60, 90],
    excerpt: 'A grounded look at this year’s trends, sorted by what will actually last.',
    storyRatio: 'default',
    sections: [
      { number: '01', title: 'Motion with restraint', color: [60, 60, 60], paragraph: LOREM },
      { number: '02', title: 'Type doing more of the work', color: [180, 140, 40], paragraph: LOREM },
      { number: '03', title: 'The return of texture', color: [40, 90, 90], paragraph: LONG_LOREM },
    ],
  },
]

const AUTHOR_ICON_COLORS = {
  'Reese Latimer': [114, 47, 55],
  'Jordan Ellis': [40, 70, 100],
}

async function main() {
  const authorIcons = {}
  for (const [name, color] of Object.entries(AUTHOR_ICON_COLORS)) {
    console.log(`Uploading author icon for "${name}"...`)
    authorIcons[name] = await uploadColorImage(`author-${name.replace(/\s+/g, '-').toLowerCase()}`, 64, 64, color)
  }

  for (let i = 0; i < ARTICLES.length; i++) {
    const a = ARTICLES[i]
    console.log(`Creating article "${a.title}"...`)

    const previewImage = await uploadColorImage(`preview-${a.slug}`, 900, 1150, a.color)

    const storySections = await Promise.all(
      a.sections.map(async (section, sIndex) => ({
        _key: `section-${i}-${sIndex}`,
        number: section.number,
        title: section.title,
        combos: [
          {
            _key: `combo-${i}-${sIndex}`,
            paragraph: section.paragraph,
            image: await uploadColorImage(`combo-${a.slug}-${sIndex}`, 1000, 1000, section.color),
          },
        ],
      }))
    )

    await client.createOrReplace({
      _id: `article-mock-${i + 1}`,
      _type: 'article',
      title: a.title,
      slug: { _type: 'slug', current: a.slug },
      subheading: a.subheading,
      date: a.date,
      author: a.author,
      authorIcon: authorIcons[a.author],
      previewImage,
      excerpt: a.excerpt,
      storyRatio: a.storyRatio,
      contentWidth: a.contentWidth || 'full',
      storySections,
    })
  }

  console.log('Done. 6 mock articles are live at /info.')
  console.log('Delete them later with: node --env-file=.env scripts/delete-mock-articles.mjs')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

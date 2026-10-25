// One-time: converts service `about.content` blocks created before the
// rich-text / unified-list schema change. Usage:
//   node --env-file=.env scripts/convert-service-content.mjs          (dry run)
//   node --env-file=.env scripts/convert-service-content.mjs --apply
import { createClient } from '@sanity/client'
import { writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const client = createClient({
  projectId: process.env.VITE_SANITY_PROJECT_ID,
  dataset: process.env.VITE_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})
const apply = process.argv.includes('--apply')
const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

const toRich = (v) =>
  typeof v === 'string'
    ? v
        .split(/\n{2,}/)
        .filter((t) => t.trim())
        .map((t) => ({ _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text: t, marks: [] }] }))
    : v

function convert(b) {
  switch (b._type) {
    case 'heading':
      return { ...b, style: b.style || 'h3' }
    case 'paragraph':
    case 'titledParagraph':
      return { ...b, text: toRich(b.text) }
    case 'bulletList':
    case 'numberedList':
      return { _type: 'list', _key: b._key, listType: b._type === 'bulletList' ? 'bullet' : 'numbered', items: b.items }
    case 'titledSection':
      return { ...b, style: b.style || 'h3', body: (b.body || []).map(convert) }
    default:
      return b
  }
}

const docs = await client.fetch(`*[_type == "service" && defined(about.content)]`)
await writeFile(new URL('./service-backup.json', import.meta.url), JSON.stringify(docs, null, 2))
for (const d of docs) {
  const content = d.about.content.map(convert)
  console.log(d._id, d.title, JSON.stringify(d.about.content.map((b) => b._type)), '->', JSON.stringify(content.map((b) => b._type)))
  if (apply) await client.patch(d._id).set({ 'about.content': content }).commit()
}
console.log(apply ? 'applied' : 'dry run only')

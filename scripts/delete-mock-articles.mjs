// Deletes the 6 mock articles created by scripts/mock-articles.mjs, plus the
// placeholder image assets they uploaded (so nothing test-only is left
// behind in the media library).
//
// Usage:
//   node --env-file=.env scripts/delete-mock-articles.mjs

import { createClient } from '@sanity/client'

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

const MOCK_IDS = Array.from({ length: 6 }, (_, i) => `article-mock-${i + 1}`)

async function main() {
  console.log('Fetching image assets referenced by mock articles...')
  const assetIds = await client.fetch(
    `*[_id in $ids]{ "refs": [previewImage.asset._ref, authorIcon.asset._ref, storySections[].combos[].image.asset._ref] }.refs[]`,
    { ids: MOCK_IDS }
  )
  const uniqueAssetIds = [...new Set((assetIds || []).filter(Boolean))]

  console.log(`Deleting ${MOCK_IDS.length} mock articles...`)
  await client.delete({ query: `*[_id in $ids]`, params: { ids: MOCK_IDS } })

  for (const assetId of uniqueAssetIds) {
    console.log(`Deleting asset ${assetId}...`)
    try {
      await client.delete(assetId)
    } catch (err) {
      // Sanity throws if an asset is still referenced elsewhere — fine to
      // skip, it's shared with something real.
      console.warn(`  skipped (${err.message})`)
    }
  }

  console.log('Done. Mock articles and their images are removed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

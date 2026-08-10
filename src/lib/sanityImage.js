import imageUrlBuilder from '@sanity/image-url'
import { sanityClient } from './sanityClient'

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}

// GROQ queries flatten Sanity image fields down to a plain
// `asset->url` string (see queries.js) so the rest of the app never has to
// touch the portable `source` object. Sanity's CDN still accepts resize
// params as plain query string params on that URL though, so we can cap
// resolution and force a modern format (WebP/AVIF via `auto=format`)
// without pulling the full image-url builder into every call site.
export function optimizedImageUrl(url, { width, quality = 75 } = {}) {
  if (!url || !url.includes('cdn.sanity.io')) return url
  const params = new URLSearchParams()
  if (width) params.set('w', Math.round(width))
  params.set('q', quality)
  params.set('auto', 'format')
  params.set('fit', 'max')
  return `${url}?${params.toString()}`
}

// Builds a `srcSet` string across the given widths so mobile viewports
// request a smaller file than desktop instead of the same full-res asset.
export function srcSetFor(url, widths, opts) {
  if (!url || !url.includes('cdn.sanity.io')) return undefined
  return widths
    .map((w) => `${optimizedImageUrl(url, { ...opts, width: w })} ${w}w`)
    .join(', ')
}

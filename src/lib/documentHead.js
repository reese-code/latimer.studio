// Small DOM-mutation helpers for per-route SEO tags — this is a plain CSR
// SPA (no SSR/Helmet), so `<title>`/meta/JSON-LD have to be kept in sync
// with the current route by hand as pages mount/unmount.
export const SITE_URL = 'https://latimer.studio'

export function setMetaDescription(content) {
  if (!content) return
  let el = document.querySelector('meta[name="description"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'description')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// Removes the canonical link when `path` is falsy (rather than leaving the
// previous page's canonical lingering) — pages that intentionally don't
// want to be indexed under a canonical URL (e.g. the 404 page) should have
// none at all, not a stale one left behind by whatever was mounted before.
export function setCanonical(path) {
  const el = document.querySelector('link[rel="canonical"]')
  if (!path) {
    el?.remove()
    return
  }
  const link = el || document.createElement('link')
  link.setAttribute('rel', 'canonical')
  link.setAttribute('href', `${SITE_URL}${path}`)
  if (!el) document.head.appendChild(link)
}

// Absence of a robots meta tag defaults to indexable, so `content: null`
// just removes the tag rather than writing an explicit "index, follow".
export function setRobots(content) {
  const el = document.querySelector('meta[name="robots"]')
  if (!content) {
    el?.remove()
    return
  }
  const meta = el || document.createElement('meta')
  meta.setAttribute('name', 'robots')
  meta.setAttribute('content', content)
  if (!el) document.head.appendChild(meta)
}

function setMetaProperty(property, content) {
  const el = document.querySelector(`meta[property="${property}"]`)
  if (!content) {
    el?.remove()
    return
  }
  const meta = el || document.createElement('meta')
  meta.setAttribute('property', property)
  meta.setAttribute('content', content)
  if (!el) document.head.appendChild(meta)
}

function setMetaName(name, content) {
  const el = document.querySelector(`meta[name="${name}"]`)
  if (!content) {
    el?.remove()
    return
  }
  const meta = el || document.createElement('meta')
  meta.setAttribute('name', name)
  meta.setAttribute('content', content)
  if (!el) document.head.appendChild(meta)
}

// `image` is intentionally optional — no branded 1200x630 share image
// exists yet, so og:image/twitter:image just stay unset (no broken/blank
// preview) until one is supplied and passed through.
export function setOpenGraph({ title, description, url, type = 'website', image } = {}) {
  setMetaProperty('og:title', title)
  setMetaProperty('og:description', description)
  setMetaProperty('og:url', url ? `${SITE_URL}${url}` : null)
  setMetaProperty('og:type', type)
  setMetaProperty('og:image', image)
}

export function setTwitterCard({ title, description, image } = {}) {
  setMetaName('twitter:card', 'summary_large_image')
  setMetaName('twitter:title', title)
  setMetaName('twitter:description', description)
  setMetaName('twitter:image', image)
}

export function setJsonLd(id, data) {
  const el = document.getElementById(id)
  if (!data) {
    el?.remove()
    return
  }
  const script = el || document.createElement('script')
  script.type = 'application/ld+json'
  script.id = id
  script.textContent = JSON.stringify(data)
  if (!el) document.head.appendChild(script)
}

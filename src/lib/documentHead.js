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

export function setCanonical(path) {
  if (!path) return
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', `${SITE_URL}${path}`)
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

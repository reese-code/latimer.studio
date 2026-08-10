import { useEffect } from 'react'
import {
  setMetaDescription,
  setCanonical,
  setRobots,
  setOpenGraph,
  setTwitterCard,
  setJsonLd,
} from '../lib/documentHead'

const DEFAULT_TITLE = document.title

// Keeps <title>, the meta description, canonical link, robots meta,
// Open Graph/Twitter tags, and one page-scoped JSON-LD block in sync with
// whichever page is mounted. Reverts everything on unmount so a fast route
// change never leaves a stale title/canonical/robots tag showing.
export function useDocumentHead({
  title,
  description,
  path,
  noindex = false,
  ogType,
  image,
  jsonLd,
}) {
  useEffect(() => {
    if (title) document.title = title
    setMetaDescription(description)
    setCanonical(path)
    setRobots(noindex ? 'noindex, nofollow' : null)
    setOpenGraph({ title, description, url: path, type: ogType, image })
    setTwitterCard({ title, description, image })
    setJsonLd('page-jsonld', jsonLd)

    return () => {
      document.title = DEFAULT_TITLE
      setCanonical(null)
      setRobots(null)
      setJsonLd('page-jsonld', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, noindex, ogType, image, JSON.stringify(jsonLd)])
}

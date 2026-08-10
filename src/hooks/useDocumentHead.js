import { useEffect } from 'react'
import { setMetaDescription, setCanonical, setJsonLd } from '../lib/documentHead'

const DEFAULT_TITLE = document.title

// Keeps <title>, the meta description, the canonical link, and one
// page-scoped JSON-LD block in sync with whichever page is mounted.
// Reverts to the site default title on unmount so a fast route change
// never leaves a stale title showing.
export function useDocumentHead({ title, description, path, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title
    setMetaDescription(description)
    setCanonical(path)
    setJsonLd('page-jsonld', jsonLd)

    return () => {
      document.title = DEFAULT_TITLE
      setJsonLd('page-jsonld', null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, JSON.stringify(jsonLd)])
}

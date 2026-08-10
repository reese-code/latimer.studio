import { useEffect } from 'react'
import { setJsonLd } from '../lib/documentHead'

// index.html already ships a static Organization block with the
// name/url/description that never change. This adds the parts that come
// from the CMS (siteSettings.contactLinks) — phone, email, and social
// profiles — as a second JSON-LD block sharing the same @id, so schema
// consumers merge them and this stays accurate to whatever's actually in
// Sanity instead of hardcoding placeholder contact info.
export function useOrganizationSchema(contactLinks) {
  useEffect(() => {
    if (!contactLinks?.length) return

    const sameAs = contactLinks
      .map((l) => l.href)
      .filter((href) => href?.startsWith('http'))

    const telephone = contactLinks
      .find((l) => l.href?.startsWith('tel:'))
      ?.href.replace('tel:', '')

    const email = contactLinks
      .find((l) => l.href?.startsWith('mailto:'))
      ?.href.replace('mailto:', '')

    setJsonLd('organization-contact-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://latimer.studio/#organization',
      ...(telephone && { telephone }),
      ...(email && { email }),
      ...(sameAs.length && { sameAs }),
    })

    return () => setJsonLd('organization-contact-jsonld', null)
  }, [contactLinks])
}

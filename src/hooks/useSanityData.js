import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanityClient'

// Fetches a GROQ query once on mount and returns { data, loading }. `data`
// stays null until the fetch resolves. Not meant for queries whose params
// change after mount — callers needing that should key their component with
// `key={...}` to force a remount instead.
export function useSanityData(query, params) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(query, params).then(
      (result) => {
        if (cancelled) return
        setData(result)
        setLoading(false)
      },
      (err) => {
        if (cancelled) return
        console.error('Sanity fetch failed:', err)
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return { data, loading }
}

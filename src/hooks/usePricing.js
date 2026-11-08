import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanityClient'
import { pricingQuery } from '../lib/queries'

// Module-level cache so every page shares one fetch.
let cached
let pending

function load() {
  pending ||= sanityClient.fetch(pricingQuery).then(
    (res) => {
      if (res?.plans?.length) cached = { ...res.settings, plans: res.plans }
      else if (res?.legacy?.plans?.length) cached = res.legacy
      else cached = null
      return cached
    },
    () => null
  )
  return pending
}

// Pricing section content from the Pricing tab in Sanity (null until loaded
// or when nothing is set up — PricingSection then shows its filler).
export function usePricing() {
  const [pricing, setPricing] = useState(cached ?? null)
  useEffect(() => {
    let cancelled = false
    load().then((res) => !cancelled && res && setPricing(res))
    return () => {
      cancelled = true
    }
  }, [])
  return pricing
}

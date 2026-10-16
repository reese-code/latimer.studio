import { useEffect, useState } from 'react'
import { sanityClient } from '../lib/sanityClient'
import { servicesQuery } from '../lib/queries'
import { SERVICES } from '../lib/services'

// Module-level cache so the homepage list and /services/:slug share one fetch.
let cached = null
let pending = null

function load() {
  pending ||= sanityClient.fetch(servicesQuery).then(
    (res) => {
      if (res?.length) cached = res
      return cached
    },
    () => null
  )
  return pending
}

// Services from Sanity when any exist, else the static fallback list.
export function useServices() {
  const [services, setServices] = useState(cached || SERVICES)
  useEffect(() => {
    let cancelled = false
    load().then((res) => !cancelled && res && setServices(res))
    return () => {
      cancelled = true
    }
  }, [])
  return services
}

import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

// createClient() throws synchronously if `projectId` is missing/invalid —
// fine once Sanity is configured, but fatal at import time (crashes the
// whole app to a blank screen) before .env is set up. Fall back to a stub
// client that just resolves empty/null instead, so the site still renders
// (in its loading state) rather than white-screening during setup.
export const sanityClient = projectId
  ? createClient({ projectId, dataset, apiVersion: '2025-01-01', useCdn: true })
  : (() => {
      console.warn(
        'VITE_SANITY_PROJECT_ID is not set — see .env.example. Sanity-backed content will stay empty until it is.'
      )
      return { fetch: () => Promise.resolve(null), config: () => ({ projectId, dataset }) }
    })()

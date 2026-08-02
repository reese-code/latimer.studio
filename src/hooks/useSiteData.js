import { useContext } from 'react'
import { SiteDataContext } from '../lib/siteDataStore'

export function useSiteData() {
  const ctx = useContext(SiteDataContext)
  if (!ctx) {
    throw new Error('useSiteData must be used within a SiteDataProvider')
  }
  return ctx
}

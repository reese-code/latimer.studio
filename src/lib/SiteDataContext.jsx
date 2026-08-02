import { useEffect, useMemo, useState } from 'react'
import { sanityClient } from './sanityClient'
import { projectsQuery, siteSettingsQuery } from './queries'
import { SiteDataContext } from './siteDataStore'

// Fetches the two pieces of content needed on almost every page
// (project list + site settings) once, high in the tree, so every
// consumer reads from context instead of re-fetching. Shape mirrors the
// old static `PROJECTS` array / `projectById()` helper from
// src/data/projects.js so callers barely change.
export function SiteDataProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [siteSettings, setSiteSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      sanityClient.fetch(projectsQuery),
      sanityClient.fetch(siteSettingsQuery),
    ]).then(
      ([projectsResult, siteSettingsResult]) => {
        if (cancelled) return
        setProjects(projectsResult || [])
        setSiteSettings(siteSettingsResult || null)
        setLoading(false)
      },
      (err) => {
        if (cancelled) return
        console.error('Failed to load site data from Sanity:', err)
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      projects,
      projectById: (id) => projects.find((p) => p.id === id),
      siteSettings,
      loading,
    }),
    [projects, siteSettings, loading]
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

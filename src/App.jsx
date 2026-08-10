import { Suspense, lazy, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import NotFoundPage from './pages/NotFoundPage'
import useLenis from './hooks/useLenis'
import { SiteDataProvider } from './lib/SiteDataContext'
import { useSiteData } from './hooks/useSiteData'
import { useOrganizationSchema } from './hooks/useOrganizationSchema'
import LoadingScreen from './components/LoadingScreen'

// Code-split — the Studio bundle is large and should never load for
// regular site visitors.
const StudioPage = lazy(() => import('./pages/StudioPage'))

// Site content mounts (and starts painting) immediately, underneath the
// loading screen overlay — so once the overlay slides away the first frame
// is already there rather than popping in.
function MainSite() {
  const { loading, siteSettings } = useSiteData()
  const [showLoader, setShowLoader] = useState(true)
  useOrganizationSchema(siteSettings?.contactLinks)

  return (
    <>
      {showLoader && (
        <LoadingScreen ready={!loading} onDone={() => setShowLoader(false)} />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  useLenis()

  return (
    <Routes>
      <Route path="/studio/*" element={
        <Suspense fallback={null}>
          <StudioPage />
        </Suspense>
      } />
      <Route path="*" element={
        <SiteDataProvider>
          <MainSite />
        </SiteDataProvider>
      } />
    </Routes>
  )
}

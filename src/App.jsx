import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CinemaPage from './pages/CinemaPage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import ServicesPage from './pages/ServicesPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import InfoPage from './pages/InfoPage'
import ArticlePage from './pages/ArticlePage'
import NotFoundPage from './pages/NotFoundPage'
import useLenis from './hooks/useLenis'
import { SiteDataProvider } from './lib/SiteDataContext'
import { useSiteData } from './hooks/useSiteData'
import { useOrganizationSchema } from './hooks/useOrganizationSchema'

// Code-split — the Studio bundle is large and should never load for
// regular site visitors.
const StudioPage = lazy(() => import('./pages/StudioPage'))

function MainSite() {
  const { siteSettings } = useSiteData()
  useOrganizationSchema(siteSettings?.contactLinks)

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cinema" element={<CinemaPage />} />
        <Route path="/projects/:id" element={<ProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:slug" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/info/:slug" element={<ArticlePage />} />
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

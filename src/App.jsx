import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import useLenis from './hooks/useLenis'
import { SiteDataProvider } from './lib/SiteDataContext'

// Code-split — the Studio bundle is large and should never load for
// regular site visitors.
const StudioPage = lazy(() => import('./pages/StudioPage'))

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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects/:id" element={<ProjectPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          </Routes>
        </SiteDataProvider>
      } />
    </Routes>
  )
}

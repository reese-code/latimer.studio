import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import useLenis from './hooks/useLenis'
import PageCurtainTransition from './components/PageCurtainTransition'

export default function App() {
  useLenis()

  return (
    <PageCurtainTransition>
      {(location) => (
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/projects/:id" element={<ProjectPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        </Routes>
      )}
    </PageCurtainTransition>
  )
}

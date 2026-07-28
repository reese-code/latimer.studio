import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProjectPage from './pages/ProjectPage'
import AboutPage from './pages/AboutPage'
import useLenis from './hooks/useLenis'

export default function App() {
  useLenis()

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/projects/:id" element={<ProjectPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}

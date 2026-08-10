import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PosterGallery from '../components/PosterGallery'
import TicketMenu from '../components/TicketMenu'
import LoadingScreen from '../components/LoadingScreen'
import { getGalleryControls } from '../lib/galleryControl'
import { useSiteData } from '../hooks/useSiteData'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function HomePage() {
  const { projects, loading } = useSiteData()
  const [showLoader, setShowLoader] = useState(true)
  useDocumentHead({
    title: 'Latimer Studio — Denver Web Design & Branding Studio for Custom, High-Converting Websites',
    description:
      'Latimer Studio is a Denver-based design studio building custom, high-converting websites and brand identities — UI/UX design, React development, and branding for businesses that want to stand out.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Latimer Studio',
      url: 'https://latimer.studio/',
    },
  })
  const [galleryPhase, setGalleryPhase] = useState('scene1-gate')
  const handlePhaseChange = useCallback((p) => setGalleryPhase(p), [])
  const location = useLocation()
  const navigate = useNavigate()

  // Once we're in the project section (ticket has popped up), the nav
  // ticket drops fully out of view. It lifts back up once the theater
  // transition begins.
  const inProjectSection = galleryPhase !== 'scene1-gate' && galleryPhase !== 'scene1'
  const hideNavTicket = inProjectSection && galleryPhase !== 'theater'

  // Returning from a project page (e.g. via "Back to Lobby") lands here at
  // the very start of the site. The nav ticket's PROJECTS link can ask (via
  // router state) to land here and jump straight to the poster gallery
  // instead, skipping both scene gates.
  useEffect(() => {
    if (location.state?.scrollTo === 'posters') {
      // Clear the one-shot state so a later back/forward nav doesn't replay it.
      navigate('.', { replace: true, state: null })
      getGalleryControls()?.jumpToPosters()
    }
  }, [])

  // The whole experience is driven by scroll-charge gates inside
  // PosterGallery, not by document scroll position — the page itself never
  // actually scrolls, so swallow wheel/touch input globally rather than
  // letting the browser try to scroll a page with nowhere to go.
  useEffect(() => {
    function block(e) { e.preventDefault() }
    window.addEventListener('wheel', block, { passive: false })
    window.addEventListener('touchmove', block, { passive: false })
    return () => {
      window.removeEventListener('wheel', block)
      window.removeEventListener('touchmove', block)
    }
  }, [])

  return (
    <>
      {showLoader && (
        <LoadingScreen ready={!loading} onDone={() => setShowLoader(false)} />
      )}
      {loading || projects.length === 0 ? (
        <div className="fixed inset-0 z-10 h-screen w-screen bg-ink" />
      ) : (
        <>
          {/* Visually hidden — the gallery below is an entirely visual/canvas
              experience with no real page copy, so this is the only text that
              gives crawlers (and screen readers) something to read as the
              page's actual title. */}
          <h1 className="sr-only">
            Websites with the structure of a Nolan plot, where every detail pays off later. Latimer Studio
          </h1>
          <h2 className="sr-only">
            Denver web design studio building custom websites, brand identities, and UI/UX design for businesses that want to stand out.
          </h2>
          <PosterGallery onPhaseChange={handlePhaseChange} projects={projects} />
          <TicketMenu forceHidden={hideNavTicket} />
        </>
      )}
    </>
  )
}

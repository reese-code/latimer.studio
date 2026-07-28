import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PosterGallery from '../components/PosterGallery'
import TicketMenu from '../components/TicketMenu'
import { getGalleryControls } from '../lib/galleryControl'

export default function HomePage() {
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
      <PosterGallery onPhaseChange={handlePhaseChange} />
      <TicketMenu forceHidden={hideNavTicket} />
    </>
  )
}

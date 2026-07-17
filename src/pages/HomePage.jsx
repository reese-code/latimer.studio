import { useState, useCallback, useEffect } from 'react'
import ScrollVideo from '../components/ScrollVideo'
import PosterGallery from '../components/PosterGallery'
import TicketMenu from '../components/TicketMenu'

// Lock scroll at the display case frame (60% of the full scroll range)
const LOCK_PROGRESS = 0.60

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const handleProgress = useCallback((p) => setScrollProgress(p), [])

  useEffect(() => {
    function lockY() {
      return (document.body.scrollHeight - window.innerHeight) * LOCK_PROGRESS
    }

    // Block wheel scroll past the lock point
    function onWheel(e) {
      if (window.scrollY >= lockY() - 2 && e.deltaY > 0) {
        e.preventDefault()
        window.scrollTo(0, lockY())
      }
    }

    // Block touch scroll past the lock point
    let touchStartY = 0
    function onTouchStart(e) { touchStartY = e.touches[0].clientY }
    function onTouchMove(e) {
      const delta = touchStartY - e.touches[0].clientY
      if (window.scrollY >= lockY() - 2 && delta > 0) {
        e.preventDefault()
      }
    }

    // Catch any scroll that slips through (keyboard, momentum)
    function onScroll() {
      if (window.scrollY > lockY() + 2) {
        window.scrollTo(0, lockY())
      }
    }

    window.addEventListener('wheel',      onWheel,      { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('scroll',     onScroll,     { passive: true })

    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('scroll',     onScroll)
    }
  }, [])

  return (
    <>
      <div style={{ height: '400vh' }} />
      <ScrollVideo onProgress={handleProgress} />
      <PosterGallery scrollProgress={scrollProgress} />
      <TicketMenu />
    </>
  )
}

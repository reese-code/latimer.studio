import { useState, useCallback, useEffect } from 'react'
import ScrollVideo from '../components/ScrollVideo'
import PosterGallery from '../components/PosterGallery'
import TicketMenu from '../components/TicketMenu'

// Lock scroll at the display case frame (60% of the full scroll range)
const LOCK_PROGRESS = 0.60

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [galleryPhase, setGalleryPhase] = useState('idle')
  const handleProgress = useCallback((p) => setScrollProgress(p), [])
  const handlePhaseChange = useCallback((p) => setGalleryPhase(p), [])

  // Once we're in the project section (ticket has popped up), the nav
  // ticket drops fully out of view. It lifts back up once the user scrolls
  // back away from the section, or once the theater transition begins.
  const atLock = scrollProgress >= LOCK_PROGRESS - 0.02
  const hideNavTicket = atLock && galleryPhase !== 'theater'

  useEffect(() => {
    function lockY() {
      return (document.body.scrollHeight - window.innerHeight) * LOCK_PROGRESS
    }

    // Once the user reaches the lock point, `locked` flips permanently true —
    // from then on scroll is trapped at exactly lockY() in BOTH directions
    // (previously only forward/downward scroll past the lock was blocked,
    // which let a small upward scroll slip through, drop scrollProgress
    // below the lock threshold, and cause the "now showing" ticket to be
    // yanked away). Once you're in the project section you stay there.
    let locked = false

    function engageLock() {
      locked = true
      window.scrollTo(0, lockY())
    }

    // Wheel scroll — block entirely once locked, regardless of direction
    function onWheel(e) {
      const ly = lockY()
      if (locked) {
        e.preventDefault()
        if (Math.abs(window.scrollY - ly) > 1) window.scrollTo(0, ly)
        return
      }
      if (window.scrollY >= ly - 2 && e.deltaY > 0) {
        e.preventDefault()
        engageLock()
      }
    }

    // Touch scroll — block entirely once locked, regardless of direction
    let touchStartY = 0
    function onTouchStart(e) { touchStartY = e.touches[0].clientY }
    function onTouchMove(e) {
      if (locked) {
        e.preventDefault()
        return
      }
      const delta = touchStartY - e.touches[0].clientY
      if (window.scrollY >= lockY() - 2 && delta > 0) {
        e.preventDefault()
        engageLock()
      }
    }

    // Catch any scroll that slips through (keyboard, momentum, etc.) and
    // snap it back to the lock position once locked; also engages the lock
    // the first time scroll reaches the threshold via any means.
    function onScroll() {
      const ly = lockY()
      if (locked) {
        if (Math.abs(window.scrollY - ly) > 2) window.scrollTo(0, ly)
        return
      }
      if (window.scrollY >= ly - 2) {
        engageLock()
      }
    }

    // Block ALL keyboard scroll keys (up and down) once locked — wheel/touch
    // handlers above don't catch keyboard-driven scrolling.
    const SCROLL_KEYS = new Set([
      'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ',
    ])
    function onKeyDown(e) {
      if (locked && SCROLL_KEYS.has(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener('wheel',      onWheel,      { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('scroll',     onScroll,     { passive: true })
    window.addEventListener('keydown',    onKeyDown,    { passive: false })

    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('scroll',     onScroll)
      window.removeEventListener('keydown',    onKeyDown)
    }
  }, [])



  return (
    <>
      <div style={{ height: '400vh' }} />
      <ScrollVideo onProgress={handleProgress} />
      <PosterGallery scrollProgress={scrollProgress} onPhaseChange={handlePhaseChange} />
      <TicketMenu forceHidden={hideNavTicket} />
    </>
  )
}

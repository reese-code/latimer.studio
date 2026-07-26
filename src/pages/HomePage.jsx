import { useState, useCallback, useEffect } from 'react'
import ScrollVideo from '../components/ScrollVideo'
import PosterGallery from '../components/PosterGallery'
import TicketMenu from '../components/TicketMenu'
import { getLenis } from '../hooks/useLenis'

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

  // Returning from a project page (e.g. via "Back to Lobby") lands here
  // outside the theater, at the very start of the site — not wherever the
  // scroll lock left off. Lenis may also still be `stop()`-ed from the
  // theater lock, since the same instance persists across route changes.
  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

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

    // Snap to the lock position and freeze it there. `lenis.stop()` is what
    // actually holds the line against wheel input — it intercepts wheel
    // events at the source, so we're not fighting Lenis's own smoothing by
    // separately re-issuing window.scrollTo on every subsequent wheel tick.
    function engageLock() {
      locked = true
      const lenis = getLenis()
      if (lenis) {
        lenis.scrollTo(lockY(), { immediate: true })
        lenis.stop()
      } else {
        window.scrollTo(0, lockY())
      }
    }

    // Wheel scroll — block entirely once locked, regardless of direction
    function onWheel(e) {
      const ly = lockY()
      if (locked) {
        e.preventDefault()
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
      <div className="h-[400vh]" />
      <ScrollVideo onProgress={handleProgress} />
      <PosterGallery scrollProgress={scrollProgress} onPhaseChange={handlePhaseChange} />
      <TicketMenu forceHidden={hideNavTicket} />
    </>
  )
}

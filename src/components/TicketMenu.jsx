import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import ticketBg from '../assets/ticket_background.png'
import { getLenis } from '../hooks/useLenis'
import { getGalleryControls } from '../lib/galleryControl'

export default function TicketMenu({ forceHidden = false }) {
  const links = ['CONTACT', 'ABOUT', 'HOME', 'PROJECTS']
  const navigate = useNavigate()
  const location = useLocation()
  const ticketRef = useRef(null)
  // Not used in render — kept as a ref rather than state to avoid an
  // unnecessary re-render / effect-cascade on every toggle.
  const isOpenRef = useRef(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const isTouch = useRef(false)
  // Mirrors isTouch.current, but as state — used only for the cursor style
  // (refs shouldn't be read during render). Computed lazily on mount so we
  // never need to call setState synchronously inside an effect.
  const [isTouchDevice] = useState(() =>
    typeof window !== 'undefined'
      ? 'ontouchstart' in window || navigator.maxTouchPoints > 0
      : false
  )

  // Detect touch device
  useEffect(() => {
    isTouch.current = isTouchDevice
  }, [isTouchDevice])

  const isHomePage = location.pathname === '/'

  // Non-home pages rest with only 60px of the ticket peeking up from the
  // bottom edge, rather than the homepage's 50%-off-screen resting state.
  const PEEK_VISIBLE_PX = 60
  const getPeekOffset = useCallback(() => {
    const height = ticketRef.current?.offsetHeight || 0
    return Math.max(height - PEEK_VISIBLE_PX, 0)
  }, [])

  // Set initial resting state — homepage starts half off-screen (y: 50%);
  // other pages start with just the 60px peek showing.
  useEffect(() => {
    if (!ticketRef.current) return
    if (isHomePage) {
      gsap.set(ticketRef.current, { y: '50%' })
    } else {
      gsap.set(ticketRef.current, { y: getPeekOffset() })
    }
  }, [isHomePage, getPeekOffset])

  const slideUp = useCallback(() => {
    gsap.to(ticketRef.current, {
      y: '0%',
      duration: 0.55,
      ease: 'power3.out',
    })
  }, [])

  const slideDown = useCallback(() => {
    gsap.to(ticketRef.current, {
      y: '50%',
      duration: 0.45,
      ease: 'power3.inOut',
    })
  }, [])

  // Non-home resting position — recedes until only 60px of the ticket
  // remains visible above the bottom edge (rather than sliding fully away).
  const peekDown = useCallback(() => {
    gsap.to(ticketRef.current, {
      y: getPeekOffset(),
      duration: 0.45,
      ease: 'power3.inOut',
    })
  }, [getPeekOffset])

  // Fully drop the ticket out of view (used when the project ticket takes
  // over, or when scrolling down) or lift it back to its normal peeking
  // rest state.
  const dropAway = useCallback(() => {
    gsap.to(ticketRef.current, {
      y: '120%',
      duration: 0.5,
      ease: 'power3.inOut',
    })
  }, [])

  // scrollHiddenRef: true once the user has scrolled down past the top —
  // the ticket drops fully out of view. Scrolling back up brings it back
  // to the half-peeking rest state. hoverRef/isOpenRef (hover on desktop,
  // tap-toggle on touch) always win over the scroll state — you can still
  // pop the ticket open by hovering/clicking, it just isn't reachable while
  // fully dropped away (nothing there to hover).
  // Non-home pages start "receded" (only the 60px peek showing) and only
  // reveal once scrolling motion is detected.
  const scrollHiddenRef = useRef(!isHomePage)
  const hoverRef = useRef(false)
  // True once the scroll has reached the very bottom of the page — on any
  // page, the ticket drops fully out of view there (rather than just
  // receding to its 60px peek), since there's nothing further to scroll to
  // reveal it for.
  const atBottomRef = useRef(false)

  const resolveVisibility = useCallback(() => {
    if (!ticketRef.current) return
    if (forceHidden) {
      dropAway()
      return
    }
    if (hoverRef.current || isOpenRef.current) {
      slideUp()
      return
    }
    if (atBottomRef.current) {
      dropAway()
      return
    }
    if (!isHomePage) {
      if (scrollHiddenRef.current) {
        peekDown()
      } else {
        slideUp()
      }
      return
    }
    if (scrollHiddenRef.current) {
      dropAway()
      return
    }
    slideDown()
  }, [forceHidden, dropAway, slideUp, slideDown, peekDown, isHomePage])

  // Responsive width — ticket size (and so the peek offset) changes across
  // the breakpoint, so re-resolve position once it's laid out.
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      requestAnimationFrame(() => resolveVisibility())
    }
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [resolveVisibility])

  useEffect(() => {
    if (!forceHidden) isOpenRef.current = false
    resolveVisibility()
  }, [forceHidden, resolveVisibility])

  // Track net movement since the last show/hide decision rather than
  // trusting Lenis's per-frame `direction` directly — direction flips
  // briefly during a scroll gesture's deceleration/settle, which was
  // fighting the drop-away tween every frame and never letting it finish.
  // A small threshold means only a real, sustained scroll one way or the
  // other flips the state.
  const lastDecisionScrollRef = useRef(0)
  const SCROLL_THRESHOLD = 10
  const BOTTOM_EPSILON = 4

  useEffect(() => {
    const onScroll = ({ scroll, limit }) => {
      const nowAtBottom = limit > 0 && scroll >= limit - BOTTOM_EPSILON
      if (nowAtBottom !== atBottomRef.current) {
        atBottomRef.current = nowAtBottom
        resolveVisibility()
      }

      if (!isHomePage) {
        // Other pages: any sustained scroll motion reveals the ticket;
        // scrolling back down sends it back to its 60px peek (it never
        // stops — it just stays wherever the last motion left it).
        const delta = scroll - lastDecisionScrollRef.current
        if (delta > SCROLL_THRESHOLD) {
          scrollHiddenRef.current = true
          lastDecisionScrollRef.current = scroll
          resolveVisibility()
        } else if (delta < -SCROLL_THRESHOLD) {
          scrollHiddenRef.current = false
          lastDecisionScrollRef.current = scroll
          resolveVisibility()
        }
        return
      }
      if (scroll <= 4) {
        scrollHiddenRef.current = false
        lastDecisionScrollRef.current = scroll
        resolveVisibility()
        return
      }
      const delta = scroll - lastDecisionScrollRef.current
      if (delta > SCROLL_THRESHOLD) {
        scrollHiddenRef.current = true
        lastDecisionScrollRef.current = scroll
        resolveVisibility()
      } else if (delta < -SCROLL_THRESHOLD) {
        scrollHiddenRef.current = false
        lastDecisionScrollRef.current = scroll
        resolveVisibility()
      }
    }

    // App's own useLenis() effect (which instantiates the singleton) is a
    // parent effect, and child effects fire before parent effects on
    // mount — so getLenis() can still be null here. Retry each frame until
    // it's ready rather than silently no-op'ing.
    let lenis = null
    let rafId = null
    let cancelled = false
    const trySubscribe = () => {
      lenis = getLenis()
      if (lenis) {
        lenis.on('scroll', onScroll)
      } else if (!cancelled) {
        rafId = requestAnimationFrame(trySubscribe)
      }
    }
    trySubscribe()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      lenis?.off('scroll', onScroll)
    }
  }, [resolveVisibility, isHomePage])

  const handleMouseEnter = () => {
    if (isTouch.current || forceHidden) return
    hoverRef.current = true
    resolveVisibility()
  }
  const handleMouseLeave = () => {
    if (isTouch.current || forceHidden) return
    hoverRef.current = false
    resolveVisibility()
  }

  const handleClick = () => {
    if (forceHidden) return
    if (isTouch.current) {
      isOpenRef.current = !isOpenRef.current
      resolveVisibility()
    }
  }

  // CONTACT — routes to the dedicated Contact page. From the homepage/
  // anywhere else that's a straight navigate; if already there, just reset
  // scroll.
  const handleContact = () => {
    if (location.pathname === '/contact') {
      const lenis = getLenis()
      if (lenis) {
        lenis.start()
        lenis.scrollTo(0, { immediate: true, force: true })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      navigate('/contact')
    }
  }

  // HOME — back to the very start of the site. From the homepage itself
  // that resets the scene gates back to the opening frame; from any other
  // page (e.g. a case study) it's a route change first.
  const handleHome = () => {
    if (location.pathname === '/') {
      getGalleryControls()?.reset()
    } else {
      navigate('/')
    }
  }

  // PROJECTS — jump straight to the poster gallery, skipping both scene
  // gates. From another page, navigate home first and ask it (via router
  // state) to land on the posters once it's mounted.
  const handleProjects = () => {
    if (location.pathname === '/') {
      getGalleryControls()?.jumpToPosters()
    } else {
      navigate('/', { state: { scrollTo: 'posters' } })
    }
  }

  // ABOUT — routes to the dedicated About page. From the homepage/anywhere
  // else that's a straight navigate; if already there, just reset scroll.
  const handleAbout = () => {
    if (location.pathname === '/about') {
      const lenis = getLenis()
      if (lenis) {
        lenis.start()
        lenis.scrollTo(0, { immediate: true, force: true })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      navigate('/about')
    }
  }

  const handleLinkClick = (link) => {
    if (link === 'HOME') handleHome()
    else if (link === 'PROJECTS') handleProjects()
    else if (link === 'ABOUT') handleAbout()
    else if (link === 'CONTACT') handleContact()
  }

  const LINK_HREFS = { HOME: '/', PROJECTS: '/', ABOUT: '/about', CONTACT: '/contact' }

  // Wrapper handles horizontal centering; ticketRef handles only Y animation.
  // pointer-events-none here because the wrapper's own layout box doesn't
  // shrink or move when the <nav> child is transformed off-screen (CSS
  // transforms don't affect the parent's hit-testable box) — without this,
  // the wrapper keeps intercepting clicks meant for whatever is underneath
  // it even after dropAway() has visually moved the nav out of the way.
  const wrapperClass = isMobile
    ? 'fixed bottom-0 left-3 right-3 z-[1000] pointer-events-none'
    : 'fixed bottom-0 left-1/2 -translate-x-1/2 w-[400px] z-[1000] pointer-events-none'

  return (
    <div className={wrapperClass}>
      {/* ticketRef element — GSAP animates Y only */}
      <nav
        ref={ticketRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`w-full pointer-events-auto ${isTouchDevice ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="relative w-full">
          <img
            src={ticketBg}
            alt=""
            className="block w-full h-auto"
            onLoad={() => resolveVisibility()}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 pt-10">
            {/* Latimer Studio — PPPlayground font */}
            <span
              className={`font-heading font-light leading-4 tracking-normal text-maroon select-none ${
                isMobile ? 'text-[64px]' : 'text-[72px]'
              }`}
            >
              Latimer Studio
            </span>

            {/* Nav links — OTNeueMontreal (Montreal Squeeze) */}
            <div className="mt-0.5 flex items-center gap-1.5 font-sans font-medium text-base tracking-[0.08em] text-[#4a3a42]">
              {links.map((link, i) => (
                <span key={link} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <span className="text-[8px] text-maroon">★</span>
                  )}
                  <a
                    href={LINK_HREFS[link]}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleLinkClick(link)
                    }}
                    className="no-underline text-inherit cursor-pointer uppercase"
                  >
                    {link}
                  </a>
                </span>
              ))}
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}

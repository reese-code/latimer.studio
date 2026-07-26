import { useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import ticketBg from '../assets/ticket_background.png'

export default function TicketMenu({ forceHidden = false }) {
  const links = ['CONTACT', 'ABOUT', 'SERVICES', 'PROJECTS']
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

  // Detect touch + responsive width
  useEffect(() => {
    isTouch.current = isTouchDevice

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isTouchDevice])



  // Set initial hidden state — translateY 50% so bottom half is off-screen
  useEffect(() => {
    if (ticketRef.current) {
      gsap.set(ticketRef.current, { y: '50%' })
    }
  }, [])

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

  // Fully drop the ticket out of view (used when the project ticket takes
  // over) or lift it back to its normal peeking rest state.
  const dropAway = useCallback(() => {
    gsap.to(ticketRef.current, {
      y: '120%',
      duration: 0.5,
      ease: 'power3.inOut',
    })
  }, [])

  useEffect(() => {
    if (!ticketRef.current) return
    if (forceHidden) {
      dropAway()
    } else {
      slideDown()
      isOpenRef.current = false
    }
  }, [forceHidden, dropAway, slideDown])

  const handleMouseEnter = () => {
    if (!isTouch.current && !forceHidden) slideUp()
  }
  const handleMouseLeave = () => {
    if (!isTouch.current && !forceHidden) slideDown()
  }

  const handleClick = () => {
    if (forceHidden) return
    if (isTouch.current) {
      if (isOpenRef.current) {
        slideDown()
        isOpenRef.current = false
      } else {
        slideUp()
        isOpenRef.current = true
      }
    }
  }



  const handleScrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase())
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

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
            alt="menu ticket"
            className="block w-full h-auto"
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
                    href={`#${link.toLowerCase()}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleScrollTo(link)
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

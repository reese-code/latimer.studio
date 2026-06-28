import { useRef, useState, useEffect, useCallback } from 'react'
import gsap from 'gsap'
import ticketBg from '../assets/ticket_background.png'

export default function TicketMenu() {
  const links = ['CONTACT', 'ABOUT', 'SERVICES', 'PROJECTS']
  const ticketRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  const isTouch = useRef(false)

  // Detect touch + responsive width
  useEffect(() => {
    isTouch.current = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  const handleMouseEnter = () => {
    if (!isTouch.current) slideUp()
  }
  const handleMouseLeave = () => {
    if (!isTouch.current) slideDown()
  }

  const handleClick = () => {
    if (isTouch.current) {
      if (isOpen) {
        slideDown()
        setIsOpen(false)
      } else {
        slideUp()
        setIsOpen(true)
      }
    }
  }

  const handleScrollTo = (id) => {
    const el = document.getElementById(id.toLowerCase())
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // Wrapper handles horizontal centering; ticketRef handles only Y animation
  const wrapperStyle = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: '12px',
        right: '12px',
        zIndex: 1000,
      }
    : {
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        zIndex: 1000,
      }

  return (
    <div style={wrapperStyle}>
      {/* ticketRef element — GSAP animates Y only */}
      <nav
        ref={ticketRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          cursor: isTouch.current ? 'pointer' : 'default',
          width: '100%',
        }}
      >
        <div style={{ position: 'relative', width: '100%' }}>
          <img
            src={ticketBg}
            alt="menu ticket"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              paddingTop: '40px',
            }}
          >
            {/* Latimer Studio — PPPlayground font */}
            <span
              style={{
                fontFamily: 'PPPlayground, serif',
                fontWeight: 300,
                fontSize: isMobile ? '64px' : '72px',
                lineHeight: '16px',
                color: '#722F37',
                letterSpacing: '0px',
                userSelect: 'none',
              }}
            >
              Latimer Studio
            </span>

            {/* Nav links — OTNeueMontreal (Montreal Squeeze) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'OTNeueMontreal, sans-serif',
                fontWeight: 500,
                fontSize: '16px',
                letterSpacing: '0.08em',
                color: '#4a3a42',
                marginTop: '2px',
              }}
            >
              {links.map((link, i) => (
                <span
                  key={link}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {i > 0 && (
                    <span style={{ fontSize: '8px', color: '#722F37' }}>
                      ★
                    </span>
                  )}
                  <a
                    href={`#${link.toLowerCase()}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleScrollTo(link)
                    }}
                    style={{
                      textDecoration: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
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

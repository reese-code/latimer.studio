import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import LetsTalkButton from './LetsTalkButton'
import { getLenis } from '../hooks/useLenis'

// Delay before the menu retracts after a link is clicked, so the new page
// has rendered underneath by the time the overlay lifts.
const NAV_SWAP_MS = 120

const NAV_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'about', to: '/about' },
  { label: 'info', to: '/info' },
  { label: 'projects', to: '/cinema' },
]

// Mobile shows the wordmark as its home link, so Home is desktop-only.
const DESKTOP_NAV_LINKS = [{ label: 'home', to: '/' }, ...NAV_LINKS]

// Mobile menu timing (ms). Keep CLOSE_* shorter than REVEAL_MS.
const REVEAL_MS = 450
const STAGGER_MS = 60
const STAGGER_DURATION_MS = 220
const CLOSE_CONTENT_MS = 140
const CLOSE_BALL_MS = 260

// Must match the Tailwind `md` breakpoint used in the classes below.
const DESKTOP_BREAKPOINT = 768

const clockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Denver',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function useDenverClock() {
  const [time, setTime] = useState(() => clockFormatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(clockFormatter.format(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

// `onOpenChange(isOpen)` lets a page react to the menu opening (e.g. hide its own nav).
// `floating` renders only the hamburger (no bar background, no desktop links)
// at every breakpoint, for pages like Cinema that bring their own chrome.
export default function SiteNav({ floating = false, onOpenChange }) {
  const time = useDenverClock()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const modeLink = pathname.startsWith('/cinema')
    ? { label: 'Normal Mode', to: '/' }
    : { label: 'Cinema Mode', to: '/cinema' }
  const navRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  // `revealed` drives the clip-path/transform and lags `isOpen` on close;
  // `contentVisible` (= isOpen) drives the link fades.
  const [revealed, setRevealed] = useState(false)
  const contentVisible = isOpen

  // Publish the bar height so the overlay can offset its content below it.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const setHeight = () => {
      document.documentElement.style.setProperty('--navbar-height', `${nav.offsetHeight}px`)
    }

    setHeight()
    const observer = new ResizeObserver(setHeight)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  // Collapse the circle only after the content has faded out.
  useEffect(() => {
    if (isOpen) return
    const timeout = setTimeout(() => setRevealed(false), CLOSE_CONTENT_MS)
    return () => clearTimeout(timeout)
  }, [isOpen])

  // While open: lock page scroll, pause Lenis, and auto-close at desktop width.
  useEffect(() => {
    if (!isOpen) return

    const closeOnDesktop = () => {
      if (!floating && window.innerWidth >= DESKTOP_BREAKPOINT) setIsOpen(false)
    }

    document.body.style.overflow = 'hidden'
    getLenis()?.stop()
    window.addEventListener('resize', closeOnDesktop)

    return () => {
      document.body.style.overflow = ''
      getLenis()?.start()
      window.removeEventListener('resize', closeOnDesktop)
    }
  }, [isOpen, floating])

  const closeMenu = () => setIsOpen(false)
  // Swap the page behind the open menu, then retract the menu to reveal it.
  const goTo = (to) => (e) => {
    if (!isOpen || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      closeMenu()
      return
    }
    e.preventDefault()
    if (to !== pathname) navigate(to)
    setTimeout(closeMenu, NAV_SWAP_MS)
  }
  const toggleMenu = () => {
    if (!isOpen) setRevealed(true)
    setIsOpen(!isOpen)
  }

  const fadeIn = (index) => ({
    opacity: contentVisible ? 1 : 0,
    transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
    transition: isOpen
      ? `opacity ${STAGGER_DURATION_MS}ms ease-out ${REVEAL_MS + index * STAGGER_MS}ms, transform ${STAGGER_DURATION_MS}ms ease-out ${REVEAL_MS + index * STAGGER_MS}ms`
      : `opacity ${CLOSE_CONTENT_MS}ms ease-in, transform ${CLOSE_CONTENT_MS}ms ease-in`,
  })

  // Hamburger bars and wordmark flip to white once the black overlay is behind them.
  const barColor = isOpen || floating ? 'bg-white' : 'bg-ink'

  return (
    <nav
      ref={navRef}
      className={`fixed inset-x-0 top-0 flex items-center justify-between px-5 py-3 max-md:px-2 ${
        floating ? 'pointer-events-none z-[1100] justify-end' : 'z-50 text-ink'
      }`}
      style={floating ? undefined : { background: "var(--color-bg) url('/concrete-texture.png') repeat fixed center top" }}
    >
      {!floating && (
      <Link
        to="/"
        onClick={goTo('/')}
        className={`relative z-20 font-sans text-[16px] font-medium uppercase leading-none no-underline transition-colors duration-300 md:hidden ${isOpen ? 'text-white' : 'text-ink'}`}
      >
        Latimer Studio
      </Link>
      )}

      {!floating && (
        <>
          {/* Desktop links */}
          <div className="hidden items-center gap-1 text-body-caps md:flex">
            {DESKTOP_NAV_LINKS.map((link, i) => (
              <span key={link.label}>
                <Link to={link.to} className="text-inherit no-underline hover:underline">
                  {link.label}
                </Link>
                {i < DESKTOP_NAV_LINKS.length - 1 && ', '}
              </span>
            ))}
          </div>

          <div className="hidden items-center gap-2 text-body-caps md:flex">
            <span>Denver, CO {time}</span>
            <Link to={modeLink.to} className="text-inherit no-underline hover:underline">
              {modeLink.label}
            </Link>
          </div>

          <LetsTalkButton className="max-md:hidden" />
        </>
      )}

      {/* Hamburger -> X. Sits above the overlay (z-20 vs z-10). */}
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        className={`pointer-events-auto relative z-20 flex h-6 w-7 flex-col items-center justify-center gap-[7px] ${floating ? '' : 'md:hidden'}`}
      >
        <span
          className={`block h-[2px] w-full transition-all duration-300 ease-in-out ${barColor} ${
            isOpen ? 'translate-y-[4.5px] rotate-45' : ''
          }`}
        />
        <span
          className={`block h-[2px] w-full transition-all duration-300 ease-in-out ${barColor} ${
            isOpen ? '-translate-y-[4.5px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Mobile overlay: full-viewport, revealed by an expanding circle that
          originates at the top-center (behind the bar). */}
      <div
        className={`fixed inset-x-0 top-0 z-10 flex h-dvh flex-col overflow-y-auto bg-black text-white ${floating ? '' : 'md:hidden'}`}
        style={{
          transform: revealed ? 'translateY(0)' : 'translateY(-100%)',
          clipPath: revealed ? 'circle(1600px at 50% -10%)' : 'circle(0px at 50% -10%)',
          transition: isOpen
            ? `clip-path ${REVEAL_MS}ms ease-out, transform 0ms`
            : `clip-path ${CLOSE_BALL_MS}ms ease-in, transform ${CLOSE_BALL_MS}ms ease-in`,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div
          className="flex flex-1 flex-col justify-between px-2 pb-3"
          style={{ paddingTop: 'calc(var(--navbar-height) + 2rem)' }}
        >
          <div className="flex flex-1 -translate-y-5 flex-col items-start justify-center gap-3 py-8 text-left">
            {NAV_LINKS.map(({ to, label }, index) => (
              <Link
                key={to}
                to={to}
                onClick={goTo(to)}
                className="font-sans font-bold uppercase leading-[115%] text-white no-underline"
                style={{ fontSize: 'min(96px, 20vw)', ...fadeIn(index) }}
                tabIndex={isOpen ? 0 : -1}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Bottom block fades in last, after the final link. */}
          <div className="flex items-end justify-between gap-3" style={fadeIn(NAV_LINKS.length)}>
            <LetsTalkButton inverted arrowAlways onClick={goTo('/contact')} tabIndex={isOpen ? 0 : -1} />
            <div className="flex flex-col items-end whitespace-nowrap text-[16px] capitalize leading-tight">
              <span>Denver, CO {time}</span>
              <Link
                to={modeLink.to}
                onClick={goTo(modeLink.to)}
                tabIndex={isOpen ? 0 : -1}
                className="text-inherit no-underline"
              >
                {modeLink.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

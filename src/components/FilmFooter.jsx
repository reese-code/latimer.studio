import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import { getGalleryControls } from '../lib/galleryControl'

// Contact + nav link data shared by every layout below. Kept in one place
// so the desktop left/right cells and the mobile dropdown never drift out
// of sync with each other.
export const CONTACT_LINKS = [
  { label: 'X', href: 'https://x.com' },
  { label: 'INSTAGRAM', href: 'https://instagram.com' },
  { label: 'TELE: 720-688-8877', href: 'tel:+17206888877' },
  { label: 'INFO@LATIMER.STUDIO', href: 'mailto:info@latimer.studio' },
  { label: '39.73921° N, 104.99030° W', href: null },
]

// Sprocket-hole band — a single row of black cells spread across the width
// with justify-between, matching the reference frame. The cell count is
// measured against the container's actual width (recomputed on resize) so
// the cells never wrap to a second row and never overflow — just an even
// spread of gaps between fixed-size boxes, box size scaled down on mobile.
function SprocketRow() {
  const containerRef = useRef(null)
  const [count, setCount] = useState(12)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const width = el.clientWidth
      const isDesktop = window.matchMedia('(min-width: 768px)').matches
      const boxSize = isDesktop ? 60
     : 40
      const pitch = boxSize * 1.2
      setCount(Math.max(2, Math.floor(width / pitch)))
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="flex w-full justify-between px-2 py-1">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="h-7 w-10 shrink-0 rounded-[3px] bg-ink md:h-10 md:w-15 md:rounded-md" />
      ))}
    </div>
  )
}

function LinkLine({ label, href, to, onClick, className = '', dark = false }) {
  const color = dark
    ? 'text-cream/85 hover:text-cream'
    : 'text-[#4a4238] hover:text-maroon'
  const base = `font-embodiment text-base leading-[145%] tracking-[0.14em] uppercase ${color} ${className}`
  const linkClass = `${base} no-underline transition-colors duration-200`

  if (onClick) {
    return (
      <a href={href ?? '#'} onClick={onClick} className={linkClass}>
        {label}
      </a>
    )
  }
  if (to) {
    return (
      <Link to={to} className={linkClass}>
        {label}
      </Link>
    )
  }
  if (!href) return <span className={base}>{label}</span>
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={linkClass}
    >
      {label}
    </a>
  )
}

// `variant="ink"` swaps the footer's usual textured case-bg + dark text for
// a black background with cream text, and drops the sprocket-hole bands —
// used on the About page, which supplies its own film-rail decoration on
// the page edges and wants the footer to sit quietly inside it instead of
// repeating the motif itself.
export default function FilmFooter({ variant = 'default' }) {
  const dark = variant === 'ink'
  const bg = dark ? 'bg-ink' : 'bg-case-bg'
  const navigate = useNavigate()
  const location = useLocation()

  // PROJECTS is the only nav link that isn't a real page — it jumps
  // straight to the poster gallery on the homepage, skipping both scene
  // gates. From another page that means navigating home first and asking
  // it (via router state) to land on the posters once mounted.
  const handleProjects = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      getGalleryControls()?.jumpToPosters()
    } else {
      navigate('/', { state: { scrollTo: 'posters' } })
    }
  }

  const navLinks = [
    { label: 'ABOUT', to: '/about' },
    { label: 'CONTACT', to: '/contact' },
    { label: 'PROJECTS', href: '/', onClick: handleProjects },
    { label: 'PRIVACY POLICY', to: '/privacy-policy' },
  ]

  return (
    <footer className={`w-full mt-10 sm:mt-30 ${bg}`}>
      {!dark && <SprocketRow />}

      <div className={`flex flex-col gap-2 md:flex-row ${dark ? '' : 'px-2'}`}>
        <LeftCell bg={bg} dark={dark} />
        <MobileLinksCell bg={bg} dark={dark} navLinks={navLinks} />
        <CenterCell bg={bg} dark={dark} />
        <RightCell bg={bg} dark={dark} navLinks={navLinks} />
      </div>

      {!dark && <SprocketRow />}
    </footer>
  )
}

function Cell({ children, className = '', bg = 'bg-case-bg' }) {
  return (
    <div className={`relative ${bg} ${className}`}>{children}</div>
  )
}

function LeftCell({ bg, dark }) {
  return (
    <Cell bg={bg} className="hidden min-h-64 flex-1 md:flex">
      <div className={`flex flex-col items-start justify-end gap-1.5 py-5 ${dark ? '' : 'px-5'}`}>
        {CONTACT_LINKS.map((link) => (
          <LinkLine key={link.label} {...link} dark={dark} />
        ))}
      </div>
    </Cell>
  )
}

function CenterCell({ bg, dark }) {
  return (
    <Cell bg={bg} className={`flex min-h-40 flex-none flex-col items-center justify-end gap-3 py-5 md:min-h-64 md:w-[38%] ${dark ? '' : 'px-5'}`}>
      <img
        src={latimerStudioLogo}
        alt="Latimer Studio"
        className={`w-full select-none md:w-105 ${dark ? 'brightness-0 invert' : ''}`}
      />
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className={`font-embodiment text-base tracking-[0.14em] uppercase ${dark ? 'text-cream/85' : 'text-[#4a4238]'}`}>
          A Creative Studio
        </span>
        <span className={`font-embodiment text-base tracking-[0.14em] uppercase ${dark ? 'text-cream/85' : 'text-[#4a4238]'}`}>
          Based out of Denver
        </span>
        <span className={`font-embodiment text-base tracking-[0.14em] uppercase ${dark ? 'text-cream/85' : 'text-[#4a4238]'}`}>
          Built to standout
        </span>
      </div>
    </Cell>
  )
}

function RightCell({ bg, dark, navLinks }) {
  return (
    <Cell bg={bg} className="hidden min-h-64 flex-1 md:flex">
      <div className={`flex w-full flex-col items-end justify-end gap-1.5 py-5 ${dark ? '' : 'px-5'}`}>
        {navLinks.map((link) => (
          <LinkLine key={link.label} {...link} dark={dark} className="text-right" />
        ))}
      </div>
    </Cell>
  )
}

// Mobile-only — the tape stacks vertically down to two cells, so the left
// (CONTACT) and right (MENU) columns each collapse into their own
// independent, left-aligned dropdown, stacked one above the other. Same
// spring motion as the case-study hero's OVERVIEW caret, mirrored to open
// downward: the panel sits below the trigger instead of above it, and
// slides in from -y instead of +y.
function MobileDropdown({ label, links, align = 'left', dark = false }) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const groupRef = useRef(null)
  const isRight = align === 'right'
  const origin = isRight ? 'top right' : 'top left'
  const labelColor = dark ? 'text-cream/85' : 'text-[#4a4238]'
  const strokeColor = dark ? 'stroke-cream/85' : 'stroke-[#4a4238]'

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, { opacity: 0, y: -28, scale: 0.6, transformOrigin: origin })
    gsap.set(groupRef.current, { opacity: 0, y: -20 })
  }, [origin])

  useLayoutEffect(() => {
    const panel = panelRef.current
    const group = groupRef.current
    if (!panel || !group) return
    gsap.killTweensOf([panel, group])

    if (open) {
      gsap.fromTo(
        panel,
        { opacity: 0, y: -28, scale: 0.6, transformOrigin: origin },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }
      )
      gsap.fromTo(
        group,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2.2)', delay: 0.06 }
      )
    } else {
      gsap.to(group, { opacity: 0, y: -16, duration: 0.22, ease: 'power1.in' })
      gsap.to(panel, {
        opacity: 0,
        y: -28,
        scale: 0.6,
        transformOrigin: origin,
        duration: 0.3,
        ease: 'power2.inOut',
        delay: 0.06,
      })
    }
  }, [open, origin])

  return (
    <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer flex-row items-center gap-2 border-none bg-transparent px-0 py-1"
      >
        <span className={`font-embodiment text-base tracking-[0.14em] ${labelColor}`}>
          {label}
        </span>
        <svg
          viewBox="0 0 12 8"
          className={`h-2 w-3 stroke-2 transition-transform duration-300 ${strokeColor} ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
        >
          <path d="M1 1L6 6L11 1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? 'mt-2 grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div ref={panelRef} className={`flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
            <div ref={groupRef} className="flex flex-col gap-1.5">
              {links.map((link) => (
                <LinkLine key={link.label} {...link} dark={dark} className={isRight ? 'text-right' : 'text-left'} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileLinksCell({ bg, dark, navLinks }) {
  return (
    <Cell bg={bg} className={`flex min-h-16 flex-row items-start justify-between gap-4 py-5 md:hidden ${dark ? '' : 'px-5'}`}>
      <MobileDropdown label="CONTACT" links={CONTACT_LINKS} dark={dark} />
      <MobileDropdown label="MENU" links={navLinks} align="right" dark={dark} />
    </Cell>
  )
}

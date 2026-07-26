import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// Contact + nav link data shared by every layout below. Kept in one place
// so the desktop left/right cells and the mobile dropdown never drift out
// of sync with each other.
const CONTACT_LINKS = [
  { label: 'X', href: 'https://x.com' },
  { label: 'INSTAGRAM', href: 'https://instagram.com' },
  { label: 'TELE: 720-688-8877', href: 'tel:+17206888877' },
  { label: 'INFO@LATIMER.STUDIO', href: 'mailto:info@latimer.studio' },
  { label: '39.73921° N, 104.99030° W', href: null },
]

const NAV_LINKS = [
  { label: 'INSTAGRAM', href: 'https://instagram.com' },
  { label: 'ABOUT', href: '#about' },
  { label: 'TELE: 720-688-8877', href: 'tel:+17206888877' },
  { label: 'CONTACT', href: '#contact' },
  { label: 'INFO@LATIMER.STUDIO', href: 'mailto:info@latimer.studio' },
  { label: 'PROJECTS', href: '/' },
  { label: 'PRIVACY POLICY', href: '#privacy' },
]

// Sprocket-hole band — a row of small punched-out squares across the full
// width of the black tape, matching the reference frame. auto-fill keeps
// the hole count responsive without any JS measuring.
function SprocketRow() {
  return (
    <div
      className="grid h-4 w-full gap-2 px-2 py-1 md:h-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(18px, 1fr))' }}
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="aspect-square rounded-[3px] bg-case-bg" />
      ))}
    </div>
  )
}

function LinkLine({ label, href, className = '' }) {
  const base = `font-embodiment text-base leading-[145%] tracking-[0.14em] text-[#4a4238] uppercase ${className}`
  if (!href) return <span className={base}>{label}</span>
  const external = href.startsWith('http')
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className={`${base} no-underline transition-colors duration-200 hover:text-maroon`}
    >
      {label}
    </a>
  )
}

export default function FilmFooter() {
  return (
    <footer className="w-full bg-ink">
      <SprocketRow />

      <div className="flex flex-col gap-2 px-2 md:flex-row">
        <LeftCell />
        <CenterCell />
        <RightCell />
        <MobileLinksCell />
      </div>

      <SprocketRow />
    </footer>
  )
}

function Cell({ children, className = '' }) {
  return (
    <div className={`relative bg-case-bg ${className}`}>{children}</div>
  )
}

function LeftCell() {
  return (
    <Cell className="hidden min-h-64 flex-1 md:flex">
      <div className="flex flex-col items-start gap-1.5 p-5">
        {CONTACT_LINKS.map((link) => (
          <LinkLine key={link.label} {...link} />
        ))}
      </div>
    </Cell>
  )
}

function CenterCell() {
  return (
    <Cell className="flex min-h-40 flex-none flex-col items-center justify-center gap-3 p-5 md:min-h-64 md:w-[38%]">
      <span className="font-heading text-[56px] leading-[0.9] font-light text-maroon select-none md:text-[72px]">
        Latimer Studio
      </span>
      <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238] uppercase">
          A Creative Studio
        </span>
        <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238] uppercase">
          Based out of Denver
        </span>
        <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238] uppercase">
          Built to standout
        </span>
      </div>
    </Cell>
  )
}

function RightCell() {
  const col1 = NAV_LINKS.filter((_, i) => i % 2 === 0)
  const col2 = NAV_LINKS.filter((_, i) => i % 2 === 1)
  return (
    <Cell className="hidden min-h-64 flex-1 md:flex">
      <div className="flex w-full flex-row items-end justify-end gap-8 p-5">
        <div className="flex flex-col items-end gap-1.5">
          {col1.map((link) => (
            <LinkLine key={link.label} {...link} className="text-right" />
          ))}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {col2.map((link) => (
            <LinkLine key={link.label} {...link} className="text-right" />
          ))}
        </div>
      </div>
    </Cell>
  )
}

// Mobile-only — the tape stacks vertically down to two cells, so every
// link collapses into a single dropdown here, grouped into CONTACT / MENU
// sections. Same spring motion as the case-study hero's OVERVIEW caret,
// mirrored to open downward: the panel sits below the trigger instead of
// above it, and slides in from -y instead of +y.
function MobileLinksCell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const groupRefs = useRef([])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, { opacity: 0, y: -28, scale: 0.6, transformOrigin: 'top center' })
    gsap.set(groupRefs.current.filter(Boolean), { opacity: 0, y: -20 })
  }, [])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const groups = groupRefs.current.filter(Boolean)
    gsap.killTweensOf([panel, ...groups])

    if (open) {
      gsap.fromTo(
        panel,
        { opacity: 0, y: -28, scale: 0.6, transformOrigin: 'top center' },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }
      )
      gsap.fromTo(
        groups,
        { opacity: 0, y: -22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.06, delay: 0.06 }
      )
    } else {
      gsap.to(groups, {
        opacity: 0,
        y: -16,
        duration: 0.22,
        ease: 'power1.in',
        stagger: { each: 0.04, from: 'end' },
      })
      gsap.to(panel, {
        opacity: 0,
        y: -28,
        scale: 0.6,
        transformOrigin: 'top center',
        duration: 0.3,
        ease: 'power2.inOut',
        delay: 0.06,
      })
    }
  }, [open])

  return (
    <Cell className="flex min-h-16 flex-col items-center p-5 md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer flex-row items-center gap-2 border-none bg-transparent px-0 py-1"
      >
        <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238]">
          LINKS
        </span>
        <svg
          viewBox="0 0 12 8"
          className={`h-2 w-3 stroke-[#4a4238] stroke-2 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
        >
          <path d="M1 1L6 6L11 1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        ref={panelRef}
        className={`mt-3 flex w-full flex-col items-center gap-6 ${
          open ? '' : 'pointer-events-none'
        }`}
      >
        <div
          ref={(el) => (groupRefs.current[0] = el)}
          className="flex flex-col items-center gap-1.5"
        >
          {CONTACT_LINKS.map((link) => (
            <LinkLine key={link.label} {...link} className="text-center" />
          ))}
        </div>
        <div
          ref={(el) => (groupRefs.current[1] = el)}
          className="flex flex-col items-center gap-1.5"
        >
          {NAV_LINKS.filter((l) => ['ABOUT', 'CONTACT', 'PROJECTS', 'PRIVACY POLICY'].includes(l.label)).map(
            (link) => (
              <LinkLine key={link.label} {...link} className="text-center" />
            )
          )}
        </div>
      </div>
    </Cell>
  )
}

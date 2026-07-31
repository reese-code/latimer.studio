import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getGalleryControls } from '../lib/galleryControl'

// Natural dimensions of the scene_1 frames — used to reproduce the same
// "cover" scale/crop math the canvas uses (SequencePlayer.drawFit) so these
// overlay panels track the marquee's lit boards at any viewport size.
const FRAME_W = 1434
const FRAME_H = 1080

// Fractional bounds (of the source frame) of the marquee's two lit boards,
// measured from scene_1/frame_0001 — LEFT is the large board facing the
// camera, RIGHT is the narrower one that wraps toward the corner.
const LEFT_PANEL  = { x0: 0.185, x1: 0.610, y0: 0.440, y1: 0.579 }
const RIGHT_PANEL = { x0: 0.642, x1: 0.886, y0: 0.431, y1: 0.565 }

// How much scroll charge (0-1, see chargeGate) the opening gate can take on
// before these links fade out — they read as text sitting on a still sign,
// so they need to be gone well before the marquee itself starts moving.
const FADE_OUT_CHARGE = 0.25

function useCoverRect(naturalW, naturalH) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    function compute() {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const scale = Math.max(vw / naturalW, vh / naturalH)
      const w = naturalW * scale
      const h = naturalH * scale
      setRect({ x: (vw - w) / 2, y: (vh - h) / 2, width: w, height: h })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [naturalW, naturalH])

  return rect
}

function panelStyle(rect, panel) {
  return {
    left:   rect.x + panel.x0 * rect.width,
    top:    rect.y + panel.y0 * rect.height,
    width:  (panel.x1 - panel.x0) * rect.width,
    height: (panel.y1 - panel.y0) * rect.height,
  }
}

const LINK_CLASS =
  'font-embodiment uppercase tracking-[0.12em] text-[#3a2f22] no-underline ' +
  'transition-colors duration-200 hover:text-maroon cursor-pointer'

function MarqueeLink({ label, href, onClick }) {
  if (!href && !onClick) return <span className={LINK_CLASS}>{label}</span>
  const external = href?.startsWith('http')
  return (
    <a
      href={href ?? '#'}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      onClick={onClick}
      className={LINK_CLASS}
    >
      {label}
    </a>
  )
}

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com' },
  { label: 'INSTAGRAM', href: 'https://instagram.com' },
  { label: 'DENVER', href: null },
]

// Overlays clickable site links on the theater marquee's two lit boards —
// visible only on the opening frame, before the first scroll gate has taken
// any charge. Scrubbing the scene even a little breaks the illusion that
// these sit on a static sign, so they fade fast once charge starts building
// (see FADE_OUT_CHARGE) and disappear entirely once the gate resolves.
export default function TheaterMarqueeLinks({ active, charge }) {
  const rect = useCoverRect(FRAME_W, FRAME_H)
  const navigate = useNavigate()
  const location = useLocation()

  const handleAbout = (e) => {
    e.preventDefault()
    navigate('/about')
  }
  const handleContact = (e) => {
    e.preventDefault()
    navigate('/contact')
  }
  const handlePrivacy = (e) => {
    e.preventDefault()
    navigate('/privacy-policy')
  }
  const handleProjects = (e) => {
    e.preventDefault()
    if (location.pathname === '/') {
      getGalleryControls()?.jumpToPosters()
    } else {
      navigate('/', { state: { scrollTo: 'posters' } })
    }
  }

  const navLinks = [
    { label: 'ABOUT', onClick: handleAbout },
    { label: 'CONTACT', onClick: handleContact },
    { label: 'PROJECTS', onClick: handleProjects },
    { label: 'PRIVACY POLICY', onClick: handlePrivacy },
  ]

  if (!rect) return null

  const isCharging = typeof charge === 'number'
  const fade = Math.max(0, 1 - (isCharging ? charge : 0) / FADE_OUT_CHARGE)
  const visible = active && fade > 0

  return (
    <div
      className="fixed inset-0 z-20"
      style={{
        opacity: visible ? fade : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: isCharging ? 'none' : 'opacity 0.3s ease',
      }}
    >
      <div
        className="absolute grid grid-cols-2 place-items-center gap-x-6 gap-y-2 text-[13px] sm:text-sm"
        style={panelStyle(rect, LEFT_PANEL)}
      >
        {navLinks.map((l) => <MarqueeLink key={l.label} {...l} />)}
      </div>
      <div
        className="absolute flex flex-col items-center justify-center gap-1.5 text-[11px] sm:text-xs"
        style={panelStyle(rect, RIGHT_PANEL)}
      >
        {SOCIAL_LINKS.map((l) => <MarqueeLink key={l.label} {...l} />)}
      </div>
    </div>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import { PROJECTS as PROJECT_LIST } from '../data/projects'


const PROJECTS = Object.fromEntries(PROJECT_LIST.map((p) => [p.id, p]))

// The final frame of each project's joined poster→theater sequence — this is
// exactly where the PosterGallery "See Project" transition leaves off, so
// the project page picks up the shot with no visual jump.
const THEATER_FINAL_FRAME = {
  ciao:     '/frames/theater_transition_1/frame_0170.webp',
  studioro: '/frames/theater_transition_2/frame_0170.webp',
  forge:    '/frames/theater_transition_3/frame_0170.webp',
}

// Zoom thresholds (viewport heights of scroll on the project page)
const ZOOM_END_VH   = 1.2   // zoom completes at 120vh
const FADE_START_VH = 1.2   // theater fades starting at 120vh
const FADE_END_VH   = 1.6   // theater gone at 160vh (content enters here)

// The "See Project" punch-zoom (PosterGallery) leaves the canvas at 1.35x —
// start the project-page scroll zoom from the same scale so the cut from
// canvas → static frame is seamless, with no snap-back.
const ZOOM_START_SCALE = 1.35
const ZOOM_RANGE       = 3.15



export default function ProjectPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const project   = PROJECTS[id]
  const theaterEl = useRef(null)
  const imgEl     = useRef(null)
  const hintEl    = useRef(null)

  // Scroll-driven zoom + fade out
  useEffect(() => {
    function tick() {
      const y  = window.scrollY
      const vh = window.innerHeight

      const zoomP  = Math.max(0, Math.min(1, y / (vh * ZOOM_END_VH)))
      const scale  = ZOOM_START_SCALE + zoomP * ZOOM_RANGE


      const fadeRange = vh * (FADE_END_VH - FADE_START_VH)
      const fadeP  = Math.max(0, Math.min(1, (y - vh * FADE_START_VH) / fadeRange))
      const opacity = 1 - fadeP

      if (imgEl.current)     imgEl.current.style.transform = `scale(${scale})`
      if (theaterEl.current) {
        theaterEl.current.style.opacity       = opacity
        theaterEl.current.style.pointerEvents = opacity < 0.05 ? 'none' : 'auto'
      }
      if (hintEl.current) {
        hintEl.current.style.opacity = Math.max(0, 1 - y / (vh * 0.2))
      }
    }

    window.addEventListener('scroll', tick, { passive: true })
    tick()
    return () => window.removeEventListener('scroll', tick)
  }, [id])

  // Overscroll-up at top → go back home
  useEffect(() => {
    function onWheel(e) {
      if (window.scrollY === 0 && e.deltaY < -30) navigate('/')
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [navigate])

  if (!project) {
    navigate('/')
    return null
  }

  return (
    <PageShell>
      {/* ── Scroll zone that drives the theater zoom ── */}
      <div style={{ height: `${FADE_END_VH * 100}vh` }} />

      {/* ── Normal project content ─────────────────── */}
      <ProjectContent project={project} onBack={() => navigate('/')} />

      {/* ── Theater overlay (fixed, zooms in then fades) */}
      <TheaterOverlay
        theaterEl={theaterEl}
        imgEl={imgEl}
        hintEl={hintEl}
        finalFrame={THEATER_FINAL_FRAME[id]}
        onBack={() => navigate('/')}
      />
    </PageShell>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{ background: '#fff', position: 'relative' }}>
      {children}
    </div>
  )
}

function TheaterOverlay({ theaterEl, imgEl, hintEl, finalFrame, onBack }) {
  return (
    <div
      ref={theaterEl}
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     100,
        overflow:   'hidden',
        // Dark warm tone matching the theater corridor walls in the display case frame
        background: '#12100a',
      }}
    >
      {/* Final frame of the theater transition — scales up to fill the
          screen from center, continuing the zoom the entrance animation
          started, then keeps zooming further as the user scrolls. */}
      <img
        ref={imgEl}
        src={finalFrame}
        alt=""
        draggable={false}
        style={{
          position:        'absolute',
          inset:           0,
          width:           '100%',
          height:          '100%',
          objectFit:       'cover',
          transformOrigin: 'center 40%',
          willChange:      'transform',
          userSelect:      'none',
        }}
      />


      {/* Vignette */}
      <div style={{
        position:      'absolute',
        inset:         0,
        background:    'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
        pointerEvents: 'none',
        zIndex:        2,
      }} />

      {/* Curtain rail */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        height:     '5px',
        background: '#722F37',
        zIndex:     3,
      }} />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position:    'absolute',
          top:         '24px',
          left:        '32px',
          zIndex:      10,
          background:  'transparent',
          border:      'none',
          color:       'rgba(255,255,255,0.45)',
          fontFamily:  'OTNeueMontreal, sans-serif',
          fontSize:    '16px',
          letterSpacing: '0.2em',
          cursor:      'pointer',
          padding:     '8px 0',
        }}
      >
        ← LOBBY

      </button>

      {/* Scroll hint */}
      <div
        ref={hintEl}
        style={{
          position:      'absolute',
          bottom:        '48px',
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        10,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '6px',
          color:         'rgba(255,255,255,0.35)',
          fontFamily:    'OTNeueMontreal, sans-serif',
          fontSize:      '16px',
          letterSpacing: '0.2em',
          userSelect:    'none',
          pointerEvents: 'none',
        }}
      >
        <span>scroll to enter</span>

        <span style={{ fontSize: '14px' }}>↓</span>
      </div>
    </div>
  )
}

function ProjectContent({ project, onBack }) {
  return (
    <div style={{
      maxWidth:   '960px',
      margin:     '0 auto',
      padding:    '80px 32px 0',
      position:   'relative',
      zIndex:     5,
      background: '#fff',
    }}>
      <ProjectHero project={project} />
      <ProjectDescription project={project} />
      <div style={{ borderTop: '1px solid #eee', margin: '0' }} />
      <ProjectFooter onBack={onBack} />
    </div>
  )
}

function ProjectHero({ project }) {
  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '280px 1fr',
      gap:                 '64px',
      alignItems:          'start',
      paddingBottom:       '64px',
    }}>
      <img
        src={project.poster}
        alt={project.label}
        draggable={false}
        style={{
          width:     '100%',
          height:    'auto',
          display:   'block',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          userSelect:'none',
        }}
      />
      <div style={{ paddingTop: '12px' }}>
        <p style={{
          fontFamily:    'OTNeueMontreal, sans-serif',
          fontSize:      '16px',
          letterSpacing: '0.35em',
          color:         '#722F37',
          margin:        '0 0 16px',
        }}>
          NOW SHOWING
        </p>

        <h1 style={{
          fontFamily:    'PPPlayground, serif',
          fontWeight:    300,
          fontSize:      '72px',
          lineHeight:    1,
          color:         '#0c0a0b',
          margin:        '0 0 14px',
          letterSpacing: '-1px',
        }}>
          {project.label}
        </h1>
        <p style={{
          fontFamily:    'OTNeueMontreal, sans-serif',
          fontSize:      '16px',
          letterSpacing: '0.12em',
          color:         '#999',
          margin:        '0 0 32px',
        }}>
          {project.type} — {project.year}
        </p>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {project.tags.map(tag => (
            <span key={tag} style={{
              fontFamily:    'OTNeueMontreal, sans-serif',
              fontSize:      '16px',
              letterSpacing: '0.14em',
              color:         '#722F37',
              border:        '1px solid #722F37',
              borderRadius:  '2px',
              padding:       '4px 10px',
            }}>

              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProjectDescription({ project }) {
  return (
    <div style={{ paddingBottom: '48px' }}>
      <p style={{
        fontFamily:  'OTNeueMontreal, sans-serif',
        fontSize:    '18px',
        lineHeight:  '1.7',
        color:       '#444',
        margin:      0,
        maxWidth:    '560px',
      }}>
        {project.description}
      </p>
    </div>
  )
}

function ProjectFooter({ onBack }) {
  return (
    <div style={{ padding: '48px 0 80px', textAlign: 'center' }}>
      <button
        onClick={onBack}
        style={{
          background:    'transparent',
          border:        'none',
          fontFamily:    'OTNeueMontreal, sans-serif',
          fontSize:      '16px',
          letterSpacing: '0.14em',
          color:         '#722F37',
          cursor:        'pointer',
          padding:       '8px 0',
        }}
      >
        ← Back to Lobby

      </button>
    </div>
  )
}

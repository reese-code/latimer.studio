import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import ciaoPoster from '../assets/ciao_poster.png'
import forgePoster from '../assets/forge_poster.png'
import studioRoPoster from '../assets/studioro_poster.png'

const PROJECTS = {
  ciao: {
    label:       'CIAO',
    poster:      ciaoPoster,
    year:        '2024',
    type:        'Brand Identity',
    tags:        ['Identity', 'Typography', 'Print'],
    description: 'A warm, expressive identity rooted in Italian culture and modernist craft. Ciao brings together typographic warmth and considered simplicity.',
  },
  forge: {
    label:       'FORGE',
    poster:      forgePoster,
    year:        '2024',
    type:        'Digital Product',
    tags:        ['Product', 'UI/UX', 'Digital'],
    description: 'A product studio building tools at the intersection of craft and technology. Forge is built for makers who think with their hands.',
  },
  studioro: {
    label:       'STUDIO RO',
    poster:      studioRoPoster,
    year:        '2023',
    type:        'Creative Direction',
    tags:        ['Direction', 'Spatial', 'Graphic'],
    description: 'Creative direction for a multidisciplinary design practice. Studio RO operates across interior, graphic, and spatial design disciplines.',
  },
}

// Zoom thresholds (viewport heights of scroll on the project page)
const ZOOM_END_VH   = 1.2   // zoom completes at 120vh
const FADE_START_VH = 1.2   // theater fades starting at 120vh
const FADE_END_VH   = 1.6   // theater gone at 160vh (content enters here)

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
      const scale  = 1 + zoomP * 3.5

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

function TheaterOverlay({ theaterEl, imgEl, hintEl, onBack }) {
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
      {/* Last frame of the scroll video — zooms in on scroll */}
      <img
        ref={imgEl}
        src="/frames/frame_0432.webp"
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
          fontSize:    '11px',
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
          fontSize:      '10px',
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
          fontSize:      '10px',
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
          fontSize:      '13px',
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
              fontSize:      '11px',
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
          fontSize:      '12px',
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

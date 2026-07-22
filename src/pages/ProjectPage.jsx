import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import gsap from 'gsap'
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

// The "See Project" punch-zoom (PosterGallery) leaves the canvas at 1.35x —
// start the project-page zoom from the same scale so the cut from
// canvas → static frame is seamless, with no snap-back.
const ZOOM_START_SCALE = 1.35
// How far the theater shot continues zooming in, automatically, before the
// case-study background fades in underneath it.
const ZOOM_END_SCALE   = 2.1

// The warm case-study background color the theater reveal fades into.
const CASE_STUDY_BG = '#F1E9DA'



export default function ProjectPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const project   = PROJECTS[id]
  const theaterEl = useRef(null)
  const imgEl     = useRef(null)

  // Automatic zoom-in → smooth cross-fade into the warm case-study
  // background. No scrolling required — this plays the instant the page
  // mounts, continuing seamlessly from the punch-zoom that finished the
  // theater transition on the previous screen.
  useEffect(() => {
    if (!project) return

    gsap.set(imgEl.current, { scale: ZOOM_START_SCALE })
    gsap.set(theaterEl.current, { opacity: 1, pointerEvents: 'auto' })

    const tl = gsap.timeline()

    tl.to(imgEl.current, {
      scale:    ZOOM_END_SCALE,
      duration: 1.6,
      ease:     'power2.out',
    }).to(theaterEl.current, {
      opacity:  0,
      duration: 1.4,
      ease:     'power2.inOut',
      onComplete: () => {
        if (theaterEl.current) theaterEl.current.style.pointerEvents = 'none'
      },
    }, '-=0.35') // slight overlap so the fade begins while still zooming in — one continuous, smooth motion

    return () => tl.kill()
  }, [id, project])

  // Scroll (or overscroll) back to the top → go back home
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
      {/* ── Project content — sits beneath the theater overlay, revealed
          automatically once the zoom + fade completes ── */}
      <ProjectContent project={project} onBack={() => navigate('/')} />

      {/* ── Theater overlay (fixed, zooms in then fades to reveal the
          case-study background beneath) ── */}
      <TheaterOverlay
        theaterEl={theaterEl}
        imgEl={imgEl}
        finalFrame={THEATER_FINAL_FRAME[id]}
        onBack={() => navigate('/')}
      />
    </PageShell>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{ background: CASE_STUDY_BG, position: 'relative', minHeight: '100vh' }}>
      {children}
    </div>
  )
}

function TheaterOverlay({ theaterEl, imgEl, finalFrame, onBack }) {
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
          started, then keeps zooming automatically before fading out. */}
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
      background: CASE_STUDY_BG,
    }}>
      <ProjectHero project={project} />
      <ProjectDescription project={project} />
      <div style={{ borderTop: '1px solid rgba(114,47,55,0.15)', margin: '0' }} />
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
          color:         '#9a8f7f',
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
        color:       '#4a4238',
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

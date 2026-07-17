import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

// Scroll progress at which scene_1 ends and we lock
const LOCK_PROGRESS = 0.60
// Start preloading scene_2 a bit before the lock so it's ready
const PRELOAD_EARLY = 0.42

// Scene_2: auto-plays once when the scroll locks (concessions → ciao poster)
const SCENE2 = { folder: '/frames/scene_2', total: 121 }

// Projects in order that matches the transition videos
const PROJECTS = [
  { id: 'ciao',     label: 'CIAO'      },
  { id: 'studioro', label: 'STUDIO RO' },
  { id: 'forge',    label: 'FORGE'     },
]

// POSTER_TRANSITIONS[i] = transition between project i and project (i+1)%3
const POSTER_TRANSITIONS = [
  { folder: '/frames/poster_transition_1', total: 73 }, // ciao ↔ studioro
  { folder: '/frames/poster_transition_2', total: 73 }, // studioro ↔ forge
  { folder: '/frames/poster_transition_3', total: 73 }, // forge ↔ ciao
]

// Theater entry transitions indexed by project
const THEATER_TRANSITIONS = [
  { folder: '/frames/theater_transition_1', total: 97 }, // ciao
  { folder: '/frames/theater_transition_2', total: 97 }, // studioro
  { folder: '/frames/theater_transition_3', total: 97 }, // forge
]

// ---------------------------------------------------------------------------
// SequencePlayer — preloads a frame folder and plays it on a canvas at 24fps
// ---------------------------------------------------------------------------
class SequencePlayer {
  constructor(folder, total) {
    this.folder    = folder
    this.total     = total
    this.images    = new Array(total).fill(null)
    this.loadCount = 0
    this._raf      = null
    this._loaded   = false
  }

  preload() {
    if (this._loaded) return
    this._loaded = true
    for (let i = 0; i < this.total; i++) {
      const img = new Image()
      img.onload = () => { this.images[i] = img; this.loadCount++ }
      img.src = `${this.folder}/frame_${String(i + 1).padStart(4, '0')}.webp`
    }
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null }
  }

  play(canvas, forward = true, onDone) {
    this.stop()
    const ctx          = canvas.getContext('2d')
    const frameDur     = 1000 / 24
    let frameIdx       = forward ? 0 : this.total - 1
    const step         = forward ? 1 : -1
    let lastTime       = null

    const drawFit = (img) => {
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
      const w = img.naturalWidth  * scale
      const h = img.naturalHeight * scale
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    }

    const tick = (now) => {
      if (lastTime === null) lastTime = now
      while (now - lastTime >= frameDur) {
        const img = this.images[frameIdx]
        if (!img) break // wait for frame rather than skip
        drawFit(img)
        frameIdx += step
        if (frameIdx < 0 || frameIdx >= this.total) { onDone?.(); return }
        lastTime += frameDur
      }
      this._raf = requestAnimationFrame(tick)
    }
    this._raf = requestAnimationFrame(tick)
  }
}

// Which transition video connects `from` and `to`, and in which direction
function resolveTransition(from, to) {
  const n = PROJECTS.length
  if (to === (from + 1) % n)     return { idx: from, forward: true  } // next
  if (to === (from + n - 1) % n) return { idx: to,   forward: false } // prev (reverse)
  return null
}

// ---------------------------------------------------------------------------
export default function PosterGallery({ scrollProgress }) {
  const navigate  = useNavigate()
  const canvasRef = useRef(null)
  const activeRef = useRef(0)

  // phase: 'idle' | 'scene2' | 'poster' | 'transition' | 'theater'
  const phaseRef  = useRef('idle')
  const setPhase  = (p) => { phaseRef.current = p }

  const [activeLabel, setActiveLabel] = useState(PROJECTS[0].label)
  const leftRef   = useRef(null)
  const rightRef  = useRef(null)
  const enterRef  = useRef(null)

  const scene2Player   = useRef(null)
  const posterPlayers  = useRef(null)
  const theaterPlayers = useRef(null)
  const didScene2      = useRef(false)

  const atLock      = scrollProgress >= LOCK_PROGRESS - 0.02
  const preloadNow  = scrollProgress >= PRELOAD_EARLY

  // Create players once on mount
  useEffect(() => {
    scene2Player.current   = new SequencePlayer(SCENE2.folder, SCENE2.total)
    posterPlayers.current  = POSTER_TRANSITIONS.map(t => new SequencePlayer(t.folder, t.total))
    theaterPlayers.current = THEATER_TRANSITIONS.map(t => new SequencePlayer(t.folder, t.total))
  }, [])

  // Hide controls initially
  useEffect(() => {
    ;[leftRef, rightRef, enterRef].forEach(r => {
      if (!r.current) return
      r.current.style.pointerEvents = 'none'
      gsap.set(r.current, { opacity: 0, y: 8 })
    })
  }, [])

  // Pre-load scene_2 before the lock point so it plays immediately
  useEffect(() => {
    if (preloadNow) scene2Player.current?.preload()
  }, [preloadNow])

  // When scroll locks, auto-play scene_2 then reveal controls
  useEffect(() => {
    if (!atLock || didScene2.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    didScene2.current = true
    setPhase('scene2')

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight

    scene2Player.current.play(canvas, true, () => {
      setPhase('poster')
      posterPlayers.current?.forEach(p => p.preload())

      ;[leftRef, rightRef, enterRef].forEach(r => {
        if (r.current) {
          r.current.style.pointerEvents = 'auto'
          gsap.to(r.current, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
        }
      })
    })
  }, [atLock])

  // ------------------------------------------------------------------
  // Arrow: skip to next/prev poster via transition video
  // ------------------------------------------------------------------
  const goTo = useCallback((next) => {
    if (phaseRef.current !== 'poster') return
    const from = activeRef.current
    if (from === next) return

    const trans  = resolveTransition(from, next)
    const canvas = canvasRef.current
    if (!trans || !canvas || !posterPlayers.current) return

    const player = posterPlayers.current[trans.idx]
    player.preload()
    setPhase('transition')

    // Hide controls while animating
    ;[leftRef, rightRef, enterRef].forEach(r => {
      if (r.current) {
        r.current.style.pointerEvents = 'none'
        gsap.to(r.current, { opacity: 0, duration: 0.18 })
      }
    })

    player.play(canvas, trans.forward, () => {
      activeRef.current = next
      setActiveLabel(PROJECTS[next].label)
      setPhase('poster')

      ;[leftRef, rightRef, enterRef].forEach(r => {
        if (r.current) {
          r.current.style.pointerEvents = 'auto'
          gsap.to(r.current, { opacity: 1, duration: 0.35 })
        }
      })
    })
  }, [])

  const prev = () => goTo((activeRef.current - 1 + PROJECTS.length) % PROJECTS.length)
  const next = () => goTo((activeRef.current + 1) % PROJECTS.length)

  // ------------------------------------------------------------------
  // Enter: play theater transition then navigate
  // ------------------------------------------------------------------
  const handleEnter = useCallback(() => {
    if (phaseRef.current !== 'poster') return
    const idx    = activeRef.current
    const player = theaterPlayers.current?.[idx]
    const canvas = canvasRef.current
    if (!player || !canvas) return

    player.preload()
    setPhase('theater')

    ;[leftRef, rightRef, enterRef].forEach(r => {
      if (r.current) {
        r.current.style.pointerEvents = 'none'
        gsap.to(r.current, { opacity: 0, duration: 0.2 })
      }
    })

    player.play(canvas, true, () => {
      navigate(`/projects/${PROJECTS[idx].id}`)
    })
  }, [navigate])

  return (
    <>
      {/* Full-screen canvas — scene_2, poster transitions, and theater transitions all play here */}
      <canvas
        ref={canvasRef}
        style={{
          position:      'fixed',
          inset:         0,
          width:         '100vw',
          height:        '100vh',
          zIndex:        10,
          display:       'block',
          background:    'transparent',
          pointerEvents: 'none',
        }}
      />

      {/* Left arrow */}
      <button
        ref={leftRef}
        onClick={prev}
        aria-label="Previous project"
        style={{
          ...arrowBase,
          position:  'fixed',
          left:      '5vw',
          top:       '50%',
          transform: 'translateY(-50%)',
          zIndex:    20,
        }}
      >
        ‹
      </button>

      {/* Right arrow */}
      <button
        ref={rightRef}
        onClick={next}
        aria-label="Next project"
        style={{
          ...arrowBase,
          position:  'fixed',
          right:     '5vw',
          top:       '50%',
          transform: 'translateY(-50%)',
          zIndex:    20,
        }}
      >
        ›
      </button>

      {/* Label + Enter button — bottom center */}
      <div
        ref={enterRef}
        style={{
          position:       'fixed',
          bottom:         '44px',
          left:           '50%',
          transform:      'translateX(-50%)',
          zIndex:         20,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '10px',
          userSelect:     'none',
        }}
      >
        <span style={{
          fontFamily:    'OTNeueMontreal, sans-serif',
          fontSize:      '11px',
          letterSpacing: '0.22em',
          color:         'rgba(255,255,255,0.55)',
        }}>
          {activeLabel}
        </span>
        <button
          onClick={handleEnter}
          style={enterBtnStyle}
        >
          ENTER
        </button>
      </div>
    </>
  )
}

const arrowBase = {
  background:     'transparent',
  border:         '1.5px solid rgba(255,255,255,0.45)',
  color:          'rgba(255,255,255,0.75)',
  width:          '44px',
  height:         '44px',
  borderRadius:   '50%',
  fontSize:       '26px',
  lineHeight:     '1',
  cursor:         'pointer',
  fontFamily:     'Georgia, serif',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  userSelect:     'none',
  paddingBottom:  '2px',
  flexShrink:     0,
}

const enterBtnStyle = {
  background:    'transparent',
  border:        '1px solid rgba(255,255,255,0.35)',
  color:         'rgba(255,255,255,0.75)',
  fontFamily:    'OTNeueMontreal, sans-serif',
  fontSize:      '10px',
  letterSpacing: '0.3em',
  padding:       '7px 32px',
  borderRadius:  '2px',
  cursor:        'pointer',
  userSelect:    'none',
}

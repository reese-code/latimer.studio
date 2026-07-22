import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ProjectTicket from './ProjectTicket'
import { PROJECTS } from '../data/projects'

// Scroll progress at which scene_1 ends and we lock
const LOCK_PROGRESS = 0.60
// Start preloading scene_2 a bit before the lock so it's ready
const PRELOAD_EARLY = 0.42

// Scene_2: auto-plays once when the scroll locks (concessions → ciao poster)
const SCENE2 = { folder: '/frames/scene_2', total: 121 }
// Playback-rate multiplier for the scene_1 → scene_2 hand-off — plays
// faster than the standard 24fps used by the poster/theater transitions.
const SCENE2_SPEED = 1.6


// POSTER_TRANSITIONS[i] = transition between project i and project (i+1)%3
const POSTER_TRANSITIONS = [
  { folder: '/frames/poster_transition_1', total: 73 }, // ciao ↔ studioro
  { folder: '/frames/poster_transition_2', total: 73 }, // studioro ↔ forge
  { folder: '/frames/poster_transition_3', total: 73 }, // forge ↔ ciao
]

// Theater entry transitions indexed by project — each folder now contains
// the "poster → theater" clip (frames 1-97) immediately followed by the
// "theater" clip (frames 98-170) joined into a single sequence.
const THEATER_TRANSITIONS = [
  { folder: '/frames/theater_transition_1', total: 170 }, // ciao
  { folder: '/frames/theater_transition_2', total: 170 }, // studioro
  { folder: '/frames/theater_transition_3', total: 170 }, // forge
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

  // `speed` is a playback-rate multiplier (1 = normal 24fps, 2 = double speed, etc).
  // Used to play the scene_1 → scene_2 hand-off faster than the rest of the
  // sequences so that leg of the experience feels snappier.
  play(canvas, forward = true, onDone, speed = 1) {
    this.stop()
    const ctx          = canvas.getContext('2d')
    const frameDur     = 1000 / (24 * speed)
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
export default function PosterGallery({ scrollProgress, onPhaseChange }) {
  const navigate  = useNavigate()
  const canvasRef = useRef(null)
  const activeRef = useRef(0)

  // phase: 'idle' | 'scene2' | 'poster' | 'transition' | 'theater'
  const phaseRef  = useRef('idle')
  const setPhase  = useCallback((p) => {
    phaseRef.current = p
    onPhaseChange?.(p)
  }, [onPhaseChange])


  const [activeProject, setActiveProject] = useState(PROJECTS[0])
  const ticketRef = useRef(null)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Ticket starts fully hidden below the viewport — it's revealed only once
  // scene_2 finishes and we enter the poster/project section.
  useEffect(() => {
    if (ticketRef.current) {
      gsap.set(ticketRef.current, { y: '140%' })
    }
  }, [])

  // Pre-load scene_2 before the lock point so it plays immediately
  useEffect(() => {
    if (preloadNow) scene2Player.current?.preload()
  }, [preloadNow])

  // When scroll locks, auto-play scene_2 then reveal the ticket
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

      // Ticket pops up into full view — GSAP slide-up reveal
      if (ticketRef.current) {
        gsap.to(ticketRef.current, {
          y: '0%',
          duration: 0.65,
          ease: 'power3.out',
        })
      }
    }, SCENE2_SPEED)

  }, [atLock, setPhase])

  // If the user scrolls back away from the project section before entering

  // the theater, drop the ticket back out of view so the nav ticket can
  // return to its normal resting state.
  useEffect(() => {
    if (atLock || !didScene2.current) return
    if (phaseRef.current === 'theater') return
    if (ticketRef.current) {
      gsap.to(ticketRef.current, {
        y: '140%',
        duration: 0.45,
        ease: 'power3.inOut',
      })
    }
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

    // Current ticket slides down and out of view as the poster transition
    // begins, so the "now showing" ticket doesn't just static-swap content —
    // it feels like leaving and a new one is arriving from below.
    if (ticketRef.current) {
      gsap.to(ticketRef.current, {
        y: '120%',
        duration: 0.35,
        ease: 'power2.in',
      })
    }

    player.play(canvas, trans.forward, () => {
      activeRef.current = next
      setActiveProject(PROJECTS[next])
      setPhase('poster')

      // New ticket rises up from below the viewport into view once the
      // transition frames finish and the new project's content is set.
      if (ticketRef.current) {
        gsap.set(ticketRef.current, { y: '120%' })
        gsap.to(ticketRef.current, {
          y: '0%',
          duration: 0.5,
          ease: 'power3.out',
        })
      }
    })
  }, [setPhase])



  const prev = () => goTo((activeRef.current - 1 + PROJECTS.length) % PROJECTS.length)
  const next = () => goTo((activeRef.current + 1) % PROJECTS.length)

  // ------------------------------------------------------------------
  // Enter: play theater transition then navigate. The ticket drops down
  // out of view (and the nav ticket lifts back up, handled by the parent
  // via onPhaseChange) while the joined poster→theater sequence plays.
  // ------------------------------------------------------------------
  const handleEnter = useCallback(() => {
    if (phaseRef.current !== 'poster') return
    const idx    = activeRef.current
    const player = theaterPlayers.current?.[idx]
    const canvas = canvasRef.current
    if (!player || !canvas) return

    player.preload()
    setPhase('theater')

    if (ticketRef.current) {
      gsap.to(ticketRef.current, {
        y: '140%',
        duration: 0.5,
        ease: 'power3.inOut',
      })
    }

    player.play(canvas, true, () => {
      // Punch-zoom into the final frame before handing off to the project
      // page, so the cut feels continuous with the theater entrance.
      gsap.to(canvas, {
        scale: 1.35,
        duration: 0.55,
        ease: 'power2.in',
        onComplete: () => {
          navigate(`/projects/${PROJECTS[idx].id}`)
        },
      })
    })
  }, [navigate, setPhase])


  return (
    <>
      {/* Full-screen canvas — scene_2, poster transitions, and theater transitions all play here */}
      <canvas
        ref={canvasRef}
        style={{
          position:        'fixed',
          inset:           0,
          width:           '100vw',
          height:          '100vh',
          zIndex:          10,
          display:         'block',
          background:      'transparent',
          pointerEvents:   'none',
          transformOrigin: '50% 40%',
        }}
      />

      {/* Ticket — "now showing" project card with prev/next + See Project */}
      <ProjectTicket
        ref={ticketRef}
        project={activeProject}
        onPrev={prev}
        onNext={next}
        onEnter={handleEnter}
        isMobile={isMobile}
      />

      {/* Mobile-only round arrow buttons, positioned beside the centered ticket */}
      {isMobile && (
        <>
          <button
            onClick={prev}
            className="nav-arrow-btn"
            aria-label="Previous project"
            style={{ ...arrowBase, position: 'fixed', left: '4vw', bottom: '110px', zIndex: 920 }}
          >
            ‹
          </button>
          <button
            onClick={next}
            className="nav-arrow-btn"
            aria-label="Next project"
            style={{ ...arrowBase, position: 'fixed', right: '4vw', bottom: '110px', zIndex: 920 }}
          >
            ›
          </button>

        </>
      )}
    </>
  )
}

const arrowBase = {
  background:     'transparent',
  border:         '1.5px solid rgba(114,47,55,0.45)',
  color:          'rgba(114,47,55,0.75)',
  width:          '40px',
  height:         '40px',
  borderRadius:   '50%',
  fontSize:       '22px',
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

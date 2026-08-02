import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ProjectTicket from './ProjectTicket'
import ScrollChargeIndicator from './ScrollChargeIndicator'
import { nextCharge, decayCharge, GATE_IDLE_MS } from '../lib/chargeGate'
import { setGalleryControls } from '../lib/galleryControl'

// scene_1: plays in full once the opening gate commits (site intro)
const SCENE1 = { folder: '/frames/scene_1', total: 122 }
// scene_2: plays in full once the second gate commits (concessions → ciao poster)
const SCENE2 = { folder: '/frames/scene_2', total: 121 }
// Playback-rate multiplier for both scene hand-offs and the theater entry —
// plays well above the standard 24fps so a committed gate resolves quickly
// instead of dragging.
const AUTO_PLAY_SPEED = 2.8
// While a gate is charging, the scene scrubs through a slice of its frames
// with the charge (forward into itself, or backward into the tail of the
// previous scene) — a little "give" so scrolling visibly does something —
// then eases back if you let up before it commits.
const PEEK_FRACTION = 0.14
const SCENE1_PEEK = Math.round(SCENE1.total * PEEK_FRACTION)
const SCENE2_PEEK = Math.round(SCENE2.total * PEEK_FRACTION)

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

  // `onFirstFrame` fires once frame 0 has loaded, so callers can paint an
  // idle/held state immediately without waiting on the rest of the sequence.
  preload(onFirstFrame) {
    if (this._loaded) return
    this._loaded = true
    for (let i = 0; i < this.total; i++) {
      const img = new Image()
      img.onload = () => {
        this.images[i] = img
        this.loadCount++
        if (i === 0) onFirstFrame?.(img)
      }
      img.src = `${this.folder}/frame_${String(i + 1).padStart(4, '0')}.webp`
    }
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null }
  }

  drawFit(canvas, img) {
    const ctx = canvas.getContext('2d')
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
    const w = img.naturalWidth  * scale
    const h = img.naturalHeight * scale
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  }

  // Draws a single frame directly, no playback loop — used to paint a held
  // gate frame.
  drawFrame(canvas, index) {
    const img = this.images[index]
    if (img) this.drawFit(canvas, img)
  }

  // `speed` is a playback-rate multiplier (1 = normal 24fps, 2 = double speed, etc).
  // `startFrame`, when given, resumes playback from there instead of the
  // sequence's natural start — used so committing a gate continues smoothly
  // from wherever the pre-commit "peek" scrub left off.
  play(canvas, forward = true, onDone, speed = 1, startFrame = null) {
    this.stop()
    const frameDur = 1000 / (24 * speed)
    let frameIdx   = startFrame != null ? startFrame : (forward ? 0 : this.total - 1)
    const step     = forward ? 1 : -1
    let lastTime   = null

    const tick = (now) => {
      if (lastTime === null) lastTime = now
      while (now - lastTime >= frameDur) {
        const img = this.images[frameIdx]
        if (!img) break // wait for frame rather than skip
        this.drawFit(canvas, img)
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
function resolveTransition(from, to, n) {
  if (to === (from + 1) % n)     return { idx: from, forward: true  } // next
  if (to === (from + n - 1) % n) return { idx: to,   forward: false } // prev (reverse)
  return null
}

// ---------------------------------------------------------------------------
// useChargeGate — the scene_1 -> scene_2 and scene_2 -> poster handoffs are
// each behind one of these. While `active`, scroll builds a signed `charge`
// against resistance (see chargeGate.js) instead of the page moving at all —
// forward toward +1, backward toward -1. Ease off before it fills and it
// drains back to 0 — nothing happens, you're still sitting at the gate. Fill
// it either direction and the matching `onCommitForward`/`onCommitBackward`
// fires once. A gate with no `onCommitBackward` (nothing precedes it) just
// bounces — charge clamps at -1 and drains back once released.
// `touchBoost` scales touch-swipe input specifically (leaving wheel/trackpad
// untouched) — mobile has no wheel, so this is the mobile-difficulty knob.
// ---------------------------------------------------------------------------
function useChargeGate(active, { onCommitForward, onCommitBackward, touchBoost = 1 } = {}) {
  const [charge, setCharge] = useState(null)

  useEffect(() => {
    if (!active) {
      setCharge(null)
      return
    }

    let value = 0
    let lastInputAt = performance.now()
    let lastTick = 0
    let raf = null
    let committed = false
    setCharge(0)

    function apply(v) {
      value = v
      setCharge(v)
    }

    function feed(deltaY) {
      if (committed) return
      lastInputAt = performance.now()
      const next = nextCharge(value, deltaY)
      apply(next)
      if (next >= 1 && onCommitForward) {
        committed = true
        setCharge(null)
        onCommitForward()
      } else if (next <= -1 && onCommitBackward) {
        committed = true
        setCharge(null)
        onCommitBackward()
      }
    }

    function onWheel(e) { e.preventDefault(); feed(e.deltaY) }

    let touchStartY = 0
    function onTouchStart(e) { touchStartY = e.touches[0].clientY }
    function onTouchMove(e) {
      e.preventDefault()
      const y = e.touches[0].clientY
      const delta = touchStartY - y
      touchStartY = y
      feed(delta * touchBoost)
    }

    const SCROLL_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '])
    function onKeyDown(e) { if (SCROLL_KEYS.has(e.key)) e.preventDefault() }

    function tick(now) {
      const dt = lastTick ? (now - lastTick) / 1000 : 0
      lastTick = now
      if (now - lastInputAt > GATE_IDLE_MS && value !== 0) {
        apply(decayCharge(value, dt))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    window.addEventListener('wheel',      onWheel,      { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('keydown',    onKeyDown,    { passive: false })

    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('keydown',    onKeyDown)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active, onCommitForward, onCommitBackward, touchBoost])

  return charge
}

// ---------------------------------------------------------------------------
// `projects` must be a non-empty array — callers (HomePage) hold off
// mounting this component until Sanity's project list has loaded.
export default function PosterGallery({ onPhaseChange, projects }) {
  const navigate  = useNavigate()
  const canvasRef = useRef(null)
  const activeRef = useRef(0)

  // phase: 'scene1-gate' | 'scene1' | 'scene2-gate' | 'scene2' | 'poster' | 'transition' | 'theater'
  const phaseRef = useRef('scene1-gate')
  const [phase, setPhaseState] = useState('scene1-gate')
  const setPhase = useCallback((p) => {
    phaseRef.current = p
    setPhaseState(p)
    onPhaseChange?.(p)
  }, [onPhaseChange])

  const [activeProject, setActiveProject] = useState(projects[0])
  const ticketRef = useRef(null)

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scene1Player   = useRef(null)
  const scene2Player   = useRef(null)
  const posterPlayers  = useRef(null)
  const theaterPlayers = useRef(null)

  // Create players, size the canvas, and start preloading scene_1 + scene_2
  // immediately — the experience is gated by scroll charge, not by how much
  // has loaded, so both need to already be in flight from frame one.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }

    scene1Player.current   = new SequencePlayer(SCENE1.folder, SCENE1.total)
    scene2Player.current   = new SequencePlayer(SCENE2.folder, SCENE2.total)
    posterPlayers.current  = POSTER_TRANSITIONS.map(t => new SequencePlayer(t.folder, t.total))
    theaterPlayers.current = THEATER_TRANSITIONS.map(t => new SequencePlayer(t.folder, t.total))

    scene1Player.current.preload(() => {
      if (canvasRef.current) scene1Player.current.drawFrame(canvasRef.current, 0)
    })
    scene2Player.current.preload()
  }, [])

  // Ticket starts fully hidden below the viewport — it's revealed only once
  // scene_2 finishes and we enter the poster/project section.
  useEffect(() => {
    if (ticketRef.current) {
      gsap.set(ticketRef.current, { y: '140%' })
    }
  }, [])

  const revealTicket = useCallback(() => {
    posterPlayers.current?.forEach(p => p.preload())
    if (ticketRef.current) {
      gsap.to(ticketRef.current, {
        y: '0%',
        duration: 0.65,
        ease: 'power3.out',
      })
    }
  }, [])

  // Gate 1 — sits at the very start of the site, on scene_1's first frame.
  // Nothing precedes it, so it only commits forward: charging it plays
  // scene_1 through in full, landing on scene_2's gate. Backward scroll here
  // just bounces (see useChargeGate).
  const handleScene1CommitForward = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPhase('scene1')
    scene1Player.current.play(canvas, true, () => {
      setPhase('scene2-gate')
    }, AUTO_PLAY_SPEED, SCENE1_PEEK)
  }, [setPhase])
  const gate1Charge = useChargeGate(phase === 'scene1-gate', {
    onCommitForward: handleScene1CommitForward,
    // The opening gate is the first thing anyone touches, and on mobile
    // (touch-swipe, no wheel) it was reading as noticeably harder to clear
    // than on desktop — give touch input a boost here specifically.
    touchBoost: 1.25,
  })

  // Gate 2 — sits at the start of scene_2. Charging it forward plays scene_2
  // through in full and reveals the poster/ticket. Charging it backward
  // plays scene_1 in reverse (from its tail back to frame 0), landing back
  // on scene_1's gate — the same motion, the other way.
  const handleScene2CommitForward = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPhase('scene2')
    scene2Player.current.play(canvas, true, () => {
      setPhase('poster')
      revealTicket()
    }, AUTO_PLAY_SPEED, SCENE2_PEEK)
  }, [setPhase, revealTicket])
  const handleScene2CommitBackward = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    setPhase('scene1')
    scene1Player.current.play(canvas, false, () => {
      setPhase('scene1-gate')
    }, AUTO_PLAY_SPEED, SCENE1.total - 1 - SCENE1_PEEK)
  }, [setPhase])
  const gate2Charge = useChargeGate(phase === 'scene2-gate', {
    onCommitForward: handleScene2CommitForward,
    onCommitBackward: handleScene2CommitBackward,
  })

  // Gate 3 — sits on the poster gallery itself, but only once you're back on
  // the first poster (ciao), since that's the one scene_2 actually lands on.
  // It only takes backward charge: scrolling up hard enough plays scene_2 in
  // reverse, back to the end of scene_1 (scene_2's gate). There's no forward
  // side — moving between posters is what the ticket's arrows are for.
  const onFirstPoster = activeProject === projects[0]
  const handlePosterCommitBackward = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (ticketRef.current) {
      gsap.to(ticketRef.current, { y: '140%', duration: 0.45, ease: 'power3.inOut' })
    }
    setPhase('scene2')
    scene2Player.current.play(canvas, false, () => {
      setPhase('scene2-gate')
    }, AUTO_PLAY_SPEED)
  }, [setPhase])
  const gate3Charge = useChargeGate(phase === 'poster' && onFirstPoster, {
    onCommitBackward: handlePosterCommitBackward,
  })

  // Scrub through a slice of frames as each gate charges — forward into the
  // gate's own scene, backward into the tail of the previous one — and ease
  // back to the rest frame as charge decays if you let up before it commits.
  useEffect(() => {
    if (phase !== 'scene1-gate' || gate1Charge == null) return
    const canvas = canvasRef.current
    if (canvas) scene1Player.current?.drawFrame(canvas, Math.max(0, Math.round(gate1Charge * SCENE1_PEEK)))
  }, [gate1Charge, phase])

  useEffect(() => {
    if (phase !== 'scene2-gate' || gate2Charge == null) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (gate2Charge >= 0) {
      scene2Player.current?.drawFrame(canvas, Math.round(gate2Charge * SCENE2_PEEK))
    } else {
      const idx = SCENE1.total - 1 + Math.round(gate2Charge * SCENE1_PEEK)
      scene1Player.current?.drawFrame(canvas, Math.max(0, idx))
    }
  }, [gate2Charge, phase])

  useEffect(() => {
    if (phase !== 'poster' || gate3Charge == null || gate3Charge >= 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const idx = SCENE2.total - 1 + Math.round(gate3Charge * SCENE2_PEEK)
    scene2Player.current?.drawFrame(canvas, Math.max(0, idx))
  }, [gate3Charge, phase])

  const activeGateCharge =
    phase === 'scene1-gate' ? gate1Charge :
    phase === 'scene2-gate' ? gate2Charge :
    phase === 'poster' ? gate3Charge :
    null

  // ------------------------------------------------------------------
  // Arrow: skip to next/prev poster via transition video
  // ------------------------------------------------------------------
  const goTo = useCallback((next) => {
    if (phaseRef.current !== 'poster') return
    const from = activeRef.current
    if (from === next) return

    const trans  = resolveTransition(from, next, projects.length)
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
      setActiveProject(projects[next])
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
  }, [setPhase, projects])

  const prev = () => goTo((activeRef.current - 1 + projects.length) % projects.length)
  const next = () => goTo((activeRef.current + 1) % projects.length)

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
          navigate(`/projects/${projects[idx].id}`)
        },
      })
    }, AUTO_PLAY_SPEED)
  }, [navigate, setPhase, projects])

  // Imperative controls for TicketMenu's HOME / PROJECTS links, which live
  // outside this component's tree and have no other way to reach it.
  useEffect(() => {
    setGalleryControls({
      reset() {
        scene1Player.current?.stop()
        scene2Player.current?.stop()
        posterPlayers.current?.forEach(p => p.stop())
        theaterPlayers.current?.forEach(p => p.stop())
        activeRef.current = 0
        setActiveProject(projects[0])
        if (ticketRef.current) gsap.set(ticketRef.current, { y: '140%' })
        const canvas = canvasRef.current
        if (canvas) scene1Player.current?.drawFrame(canvas, 0)
        setPhase('scene1-gate')
      },
      jumpToPosters() {
        scene1Player.current?.stop()
        scene2Player.current?.stop()
        activeRef.current = 0
        setActiveProject(projects[0])
        const canvas = canvasRef.current
        if (canvas) scene2Player.current?.drawFrame(canvas, SCENE2.total - 1)
        setPhase('poster')
        revealTicket()
      },
    })
    return () => setGalleryControls(null)
  }, [setPhase, revealTicket, projects])

  return (
    <>
      {/* Full-screen canvas — scene_1, scene_2, poster transitions, and
          theater transitions all play here */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-10 block h-screen w-screen bg-transparent pointer-events-none origin-[50%_40%]"
      />

      {/* Ticket — "now showing" project card with prev/next + See Project.
          The ticket's own perforated flaps handle prev/next on every
          breakpoint, so no separate round arrow buttons are needed. */}
      <ProjectTicket
        ref={ticketRef}
        project={activeProject}
        onPrev={prev}
        onNext={next}
        onEnter={handleEnter}
        isMobile={isMobile}
      />

      <ScrollChargeIndicator
        visible={activeGateCharge != null}
        charge={activeGateCharge}
      />
    </>
  )
}

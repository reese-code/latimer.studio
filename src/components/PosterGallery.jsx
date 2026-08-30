import { useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import ProjectTicket from './ProjectTicket'
import ScrollChargeIndicator from './ScrollChargeIndicator'
import ScrollHint from './ScrollHint'
import { nextCharge, decayCharge, COMMIT_THRESHOLD, GATE_IDLE_MS } from '../lib/chargeGate'
import { setGalleryControls } from '../lib/galleryControl'

// scene_1: plays in full once the opening gate commits (site intro)
const SCENE1 = { folder: '/frames/scene_1', total: 121 }
// scene_2: plays in full once the second gate commits (concessions → ciao poster)
const SCENE2 = { folder: '/frames/scene_2', total: 121 }
// Playback-rate multiplier for both scene hand-offs and the theater entry —
// plays well above the standard 24fps so a committed gate resolves quickly
// instead of dragging.
const AUTO_PLAY_SPEED = 2.8
// Touch-swipe input (mobile, no wheel) reads as noticeably harder to clear
// a gate with than the equivalent desktop wheel/trackpad distance — this
// multiplies touch deltaY specifically so mobile only needs about half the
// physical scroll distance desktop does to commit any gate.
const MOBILE_TOUCH_BOOST = 2
// While a gate is charging, the scene scrubs through a slice of its frames
// with the charge (forward into itself, or backward into the tail of the
// previous scene) — this is the primary visual read that scrolling is doing
// something (siena.film-style). Scroll only drives the first slice of the
// scene; committing hands off to an auto-play that continues seamlessly
// from wherever that peek left off (not a reset to the start) through the
// rest of the scene at AUTO_PLAY_SPEED. Easing back if you let up before it
// commits works the same as before, just over a shorter visible travel.
const PEEK_FRACTION = 0.3
// Capped at total - 1 (not total) so a fully-charged gate's peek lands on
// the sequence's actual last valid frame index — using `total` itself would
// hand SequencePlayer.play() an out-of-range startFrame, which reads as a
// "not loaded yet" frame and stalls for a full second before bailing.
const SCENE1_PEEK = Math.min(SCENE1.total - 1, Math.round(SCENE1.total * PEEK_FRACTION))
const SCENE2_PEEK = Math.min(SCENE2.total - 1, Math.round(SCENE2.total * PEEK_FRACTION))
// Same idea for the poster-to-poster hand-offs (see the poster gate below).
const POSTER_PEEK_FRACTION = 0.3

// Full-charge peek target for a poster transition of the given length —
// mirrors SCENE1_PEEK/SCENE2_PEEK's capping so a scroll-committed transition
// can resume playback exactly where the peek scrub left off, instead of
// restarting from the clip's own natural start (which reads as the
// animation reverting back to the beginning).
function posterPeekFrames(total) {
  return Math.min(total - 1, Math.round(total * POSTER_PEEK_FRACTION))
}

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
    let waitStart  = null

    const tick = (now) => {
      if (lastTime === null) lastTime = now
      while (now - lastTime >= frameDur) {
        const img = this.images[frameIdx]
        if (!img) {
          // A frame that's missing (failed to load, or the folder's actual
          // file count drifted below `total`) would otherwise stall the
          // sequence here forever with no way for the caller to recover —
          // bail out to onDone once we've waited a full second for it.
          if (waitStart === null) waitStart = now
          if (now - waitStart > 1000) { onDone?.(); return }
          break
        }
        waitStart = null
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

// Normalizes a gate's charge (0..COMMIT_THRESHOLD, signed) to -1..1 so the
// peek-scrub effects below reach their full travel distance exactly as the
// gate commits, rather than only ever covering the first COMMIT_THRESHOLD
// slice of it — the visual motion still uses the whole peek range per
// scroll gesture even though less charge is now required to commit it.
function peekProgress(charge) {
  return Math.max(-1, Math.min(1, charge / COMMIT_THRESHOLD))
}

// Draws a peeked frame on `player` for a gate charging in one direction.
// `forward` is the *player's own* natural playback direction for this
// hand-off (from resolveTransition) — peeking "into" that direction reads
// from its head (0..peekFrames), peeking "away" from it reads its tail
// (total-1..total-1-peekFrames). `magnitude` is 0..1 (see peekProgress).
function drawPeek(canvas, player, total, forward, magnitude, peekFrames) {
  const span = Math.round(magnitude * peekFrames)
  const idx = forward ? span : total - 1 - span
  player.drawFrame(canvas, Math.max(0, Math.min(total - 1, idx)))
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
// How quickly the *displayed* charge (what the peek-scrub and charge
// indicator actually render) catches up to the raw physics charge each
// frame. Decoupling display from the raw value means a single bursty
// wheel/touch event (a fast flick, a big wheel-mouse notch) glides smoothly
// across the frames in between over a few animation frames, instead of the
// canvas snapping straight to whatever frame the raw jump lands on and
// visibly skipping the frames in between. Commit timing is unaffected —
// that's still decided by the raw value, not this smoothed one.
const DISPLAY_SMOOTHING_RATE = 22

function useChargeGate(active, { onCommitForward, onCommitBackward, touchBoost = 1, onCharge } = {}) {
  const [charge, setCharge] = useState(null)

  useEffect(() => {
    if (!active) {
      setCharge(null)
      return
    }

    let value = 0   // raw physics charge — drives commit/decay
    let display = 0 // smoothed charge — what consumers (peek, indicator) see
    let lastInputAt = performance.now()
    let lastTick = 0
    let raf = null
    let committed = false
    setCharge(0)

    function feed(deltaY) {
      if (committed) return
      lastInputAt = performance.now()
      const next = nextCharge(value, deltaY)
      value = next
      onCharge?.(next)
      if (next >= COMMIT_THRESHOLD && onCommitForward) {
        committed = true
        setCharge(null)
        onCommitForward()
      } else if (next <= -COMMIT_THRESHOLD && onCommitBackward) {
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
      if (committed) return
      const dt = lastTick ? (now - lastTick) / 1000 : 0
      lastTick = now
      if (now - lastInputAt > GATE_IDLE_MS && value !== 0) {
        value = decayCharge(value, dt)
      }
      display += (value - display) * Math.min(1, dt * DISPLAY_SMOOTHING_RATE)
      setCharge(display)
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
  }, [active, onCommitForward, onCommitBackward, touchBoost, onCharge])

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

  // Create players, size the canvas, and start preloading everything
  // immediately — the experience is gated by scroll charge, not by how much
  // has loaded, so nothing should sit idle waiting for a later trigger.
  // HomePage mounts underneath the loading screen (see App.jsx), so this
  // whole cascade is already running during that ~6.5s intro animation and
  // whatever time the visitor spends charging the first two gates — by far
  // the best window to get ahead of the poster/theater sequences too.
  // scene_1 and scene_2 go first (needed almost immediately); the poster
  // transitions follow right behind since reaching them just requires
  // clearing two scroll gates. Theater transitions are the heaviest set (3 x
  // 170 frames) and are only ever needed once someone lingers on a poster,
  // so those preload per-project once the poster gallery is actually reached
  // (see revealTicket/goTo below) rather than all three up front.
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

    // scene_1 (needed almost immediately) and the page's own initial paint
    // get the network/CPU first; scene_2 and the poster transitions start
    // preloading a beat later, staggered one after another via
    // requestIdleCallback, instead of all four sequences (~460 images)
    // racing the page's own JS/CSS — and each other — for bandwidth in the
    // same tick. Applies on both mobile and desktop now: doesn't change what
    // loads or when it's needed, only spreads out when the browser starts
    // fetching it. Safari never shipped requestIdleCallback, hence the
    // timeout fallback.
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 200))
    const preloadStaggered = (players, gapMs = 150) => {
      players.forEach((p, i) => {
        setTimeout(() => ric(() => p?.preload()), i * gapMs)
      })
    }
    preloadStaggered([scene2Player.current, ...posterPlayers.current])
  }, [])

  // Ticket starts fully hidden below the viewport — it's revealed only once
  // scene_2 finishes and we enter the poster/project section.
  useEffect(() => {
    if (ticketRef.current) {
      gsap.set(ticketRef.current, { y: '140%' })
    }
  }, [])

  const revealTicket = useCallback(() => {
    // The poster/transition sequences are already preloading from mount (see
    // above) — the only thing worth kicking off fresh here is the current
    // project's theater-entry clip, since that's the heaviest sequence and
    // otherwise wouldn't start loading until the "Enter" click itself.
    theaterPlayers.current?.[activeRef.current]?.preload()
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
  // Reflects live charge while sitting at gate 1, rather than latching once
  // forward scroll starts: scrolling forward flips "Scroll down to enter"
  // to "Keep scrolling down", and rubber-banding back to rest (released
  // before the gate commits) flips it back — matching the actual charge,
  // not just "has this ever been touched." Once the gate commits, phase
  // moves past 'scene1-gate' and this simply stops updating, leaving it on
  // "Keep scrolling down" for the rest of the pre-poster phases.
  const [introScrollStarted, setIntroScrollStarted] = useState(false)
  const gate1Charge = useChargeGate(phase === 'scene1-gate', {
    onCommitForward: handleScene1CommitForward,
    touchBoost: MOBILE_TOUCH_BOOST,
  })
  useEffect(() => {
    if (phase !== 'scene1-gate' || gate1Charge == null) return
    setIntroScrollStarted(gate1Charge > 0)
  }, [gate1Charge, phase])

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
    touchBoost: MOBILE_TOUCH_BOOST,
  })

  // Poster gate — sits on the poster gallery itself, active on every poster.
  // Forward charge always advances to the next project, wrapping around
  // forever (an infinite loop through the projects). Backward charge steps
  // back to the previous project — except from the first poster (ciao),
  // where nothing precedes it in the gallery, so backward charge instead
  // plays scene_2 in reverse back to the end of scene_1 (scene_2's gate),
  // exiting the poster loop back out through the intro.
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

  // Scrub through a slice of frames as each gate charges — forward into the
  // gate's own scene, backward into the tail of the previous one — and ease
  // back to the rest frame as charge decays if you let up before it commits.
  useEffect(() => {
    if (phase !== 'scene1-gate' || gate1Charge == null) return
    const canvas = canvasRef.current
    if (canvas) scene1Player.current?.drawFrame(canvas, Math.max(0, Math.round(peekProgress(gate1Charge) * SCENE1_PEEK)))
  }, [gate1Charge, phase])

  useEffect(() => {
    if (phase !== 'scene2-gate' || gate2Charge == null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const progress = peekProgress(gate2Charge)
    if (progress >= 0) {
      scene2Player.current?.drawFrame(canvas, Math.round(progress * SCENE2_PEEK))
    } else {
      const idx = SCENE1.total - 1 + Math.round(progress * SCENE1_PEEK)
      scene1Player.current?.drawFrame(canvas, Math.max(0, idx))
    }
  }, [gate2Charge, phase])

  // ------------------------------------------------------------------
  // Arrow: skip to next/prev poster via transition video
  // ------------------------------------------------------------------
  // `continueFromPeek` is true only for scroll-gate commits — it resumes
  // playback from wherever the pre-commit peek scrub already reached
  // (matching drawPeek's own head/tail formula below) instead of restarting
  // from the clip's natural start, which used to read as the animation
  // reverting back to the beginning right after the user had scrolled
  // through part of it. Arrow-button navigation (prev/next) still plays the
  // whole clip from the start, since there's no preceding scroll to resume.
  const goTo = useCallback((next, continueFromPeek = false) => {
    if (phaseRef.current !== 'poster') return
    const from = activeRef.current
    if (from === next) return

    const trans  = resolveTransition(from, next, projects.length)
    const canvas = canvasRef.current
    if (!trans || !canvas || !posterPlayers.current) return

    const player = posterPlayers.current[trans.idx]
    const total  = POSTER_TRANSITIONS[trans.idx].total
    const peek   = posterPeekFrames(total)
    const startFrame = continueFromPeek ? (trans.forward ? peek : total - 1 - peek) : null
    const speed  = continueFromPeek ? AUTO_PLAY_SPEED : 1
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
      // Get ahead of the next likely "Enter" click the same way revealTicket
      // does for the first project.
      theaterPlayers.current?.[next]?.preload()

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
    }, speed, startFrame)
  }, [setPhase, projects])

  const prev = () => goTo((activeRef.current - 1 + projects.length) % projects.length)
  const next = () => goTo((activeRef.current + 1) % projects.length)

  // Poster gate — sits on the poster gallery itself, active on every poster.
  // Forward charge always advances to the next project via goTo, wrapping
  // around forever (an infinite loop through the projects). Backward charge
  // steps back to the previous project the same way — except from the first
  // poster (ciao), where nothing precedes it in the gallery, so backward
  // charge instead plays scene_2 in reverse back to the end of scene_1
  // (scene_2's gate), exiting the poster loop back out through the intro.
  const handlePosterCommitForward = useCallback(() => {
    goTo((activeRef.current + 1) % projects.length, true)
  }, [goTo, projects.length])
  const handlePosterCommitBackwardGate = useCallback(() => {
    if (onFirstPoster) {
      handlePosterCommitBackward()
    } else {
      goTo((activeRef.current - 1 + projects.length) % projects.length, true)
    }
  }, [onFirstPoster, handlePosterCommitBackward, goTo, projects.length])
  const posterGateCharge = useChargeGate(phase === 'poster', {
    onCommitForward: handlePosterCommitForward,
    onCommitBackward: handlePosterCommitBackwardGate,
    touchBoost: MOBILE_TOUCH_BOOST,
  })

  // Peek into the poster-to-poster transition clips as the poster gate
  // charges — forward charge peeks the head of the "next" transition,
  // backward charge peeks the tail of the "prev" transition (unless we're
  // on the first poster, where backward instead peeks scene_2's tail, same
  // as the old first-poster-only gate did).
  useEffect(() => {
    if (phase !== 'poster' || posterGateCharge == null) return
    const canvas = canvasRef.current
    if (!canvas || !posterPlayers.current) return
    const progress = peekProgress(posterGateCharge)
    const from = activeRef.current

    if (progress > 0) {
      const to = (from + 1) % projects.length
      const trans = resolveTransition(from, to, projects.length)
      if (!trans) return
      const total = POSTER_TRANSITIONS[trans.idx].total
      const peek = posterPeekFrames(total)
      drawPeek(canvas, posterPlayers.current[trans.idx], total, trans.forward, progress, peek)
    } else if (progress < 0) {
      const magnitude = Math.abs(progress)
      if (onFirstPoster) {
        const idx = SCENE2.total - 1 + Math.round(magnitude * SCENE2_PEEK)
        scene2Player.current?.drawFrame(canvas, Math.max(0, idx))
        return
      }
      const to = (from - 1 + projects.length) % projects.length
      const trans = resolveTransition(from, to, projects.length)
      if (!trans) return
      const total = POSTER_TRANSITIONS[trans.idx].total
      const peek = posterPeekFrames(total)
      drawPeek(canvas, posterPlayers.current[trans.idx], total, trans.forward, magnitude, peek)
    }
  }, [posterGateCharge, phase, onFirstPoster, projects.length])

  const activeGateCharge =
    phase === 'scene1-gate' ? gate1Charge :
    phase === 'scene2-gate' ? gate2Charge :
    phase === 'poster' ? posterGateCharge :
    null

  // Rolling-counter index into ScrollHint's line stack (see LINES there).
  // 'transition' and 'theater' have no line of their own — they're brief,
  // scroll- or tap-driven hand-offs — so the index simply holds wherever it
  // last was instead of resetting, keeping copy on screen the whole time
  // rather than disappearing mid-hand-off.
  const [hintIndex, setHintIndex] = useState(0)
  useEffect(() => {
    let target = null
    if (phase === 'scene1-gate' && !introScrollStarted) target = 0
    else if (phase === 'scene1-gate' || phase === 'scene1' || phase === 'scene2-gate' || phase === 'scene2') target = 1
    else if (phase === 'poster') target = posterGateCharge ? 3 : 2
    if (target != null) setHintIndex(target)
  }, [phase, introScrollStarted, posterGateCharge])

  // Charge progress bar — mirrors the active gate's charge while one is
  // active, but on commit (activeGateCharge drops to null) it snaps to a
  // full bar in the committed direction and fades out via
  // ScrollChargeIndicator's own opacity transition, instead of just
  // vanishing mid-fill.
  const [barCharge, setBarCharge] = useState(null)
  const [barVisible, setBarVisible] = useState(false)
  const prevGateChargeRef = useRef(null)
  useEffect(() => {
    if (activeGateCharge != null) {
      setBarCharge(activeGateCharge)
      setBarVisible(true)
    } else if (prevGateChargeRef.current != null) {
      setBarCharge((Math.sign(prevGateChargeRef.current) || 1) * COMMIT_THRESHOLD)
      setBarVisible(false)
    }
    prevGateChargeRef.current = activeGateCharge
  }, [activeGateCharge])

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

      <div className="pointer-events-none fixed inset-x-0 top-0 z-20">
        {/* Small gradient so the hint/progress-bar text stays legible over
            whatever's playing in the canvas behind it. */}
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/50 to-transparent" />

        <div className="relative flex flex-col items-center gap-2 pt-3">
          <ScrollHint index={hintIndex} />

          <ScrollChargeIndicator
            visible={barVisible}
            charge={barCharge}
          />
        </div>
      </div>

      {/* Center tap zone — lets you enter the theater by tapping anywhere on
          screen while sitting on a poster, matching the "Tap to enter
          theater" hint above. Sits below the nav ticket (z-[1000]) and the
          project ticket (z-[900]), so their own buttons/flaps still take the
          click first over this catch-all. */}
      {phase === 'poster' && (
        <button
          type="button"
          onClick={handleEnter}
          aria-label="Enter theater"
          className="fixed inset-0 z-30 cursor-pointer border-none bg-transparent p-0"
        />
      )}
    </>
  )
}

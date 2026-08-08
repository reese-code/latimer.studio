import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmRail from './FilmRail'

// Desktop/mobile rail cell sizes, same scale used on the About/Contact
// poster layouts (see AboutPosterDesktop / AboutStackedMobile) so the
// sprocket motif reads consistently across the site.
const RAIL_DESKTOP = { boxW: 40, boxH: 55, radius: 8, gap: 20, pad: 20 }
const RAIL_MOBILE = { boxW: 8, boxH: 14, radius: 2, gap: 6, pad: 4 }

// Extra rail cells rendered above/below the visible window (see FilmRail's
// `overscanAbove`/`overscanBelow`), sized as a multiple of viewport height
// so the strip always reads as "centered" — plenty of cells sitting off
// both the top and bottom edges, not just wherever the animation happens to
// need them — and never runs out however far a hop or the pre-reveal shift
// pushes it.
const RAIL_HOP_MIN_VH = -0.42 // furthest a hop can land above start (up)
const RAIL_HOP_MAX_VH = 0.12 // furthest a hop can land below start (down)
const RAIL_ACCELERATE_VH = 1.6
const RAIL_BUFFER_ABOVE_VH = 0.4
const RAIL_BUFFER_BELOW_VH = (Math.abs(RAIL_HOP_MIN_VH) + RAIL_ACCELERATE_VH) * 1.6

// Progress crosses these thresholds to change what the decorative rails and
// screen itself are doing — see the phase effect below.
const ACCELERATE_AT = 95

// Ceiling the fake progress won't cross until the real site data (`ready`)
// has actually finished loading — classic "trickle and wait" progress-bar
// pattern so the number never lies about being done. Whole sequence (title
// in, count up, accelerate, slide away) is paced to ~6.5s end to end.
const HOLD_CEILING = 92
// Nominal time (seconds) the count-up takes to reach HOLD_CEILING at its
// average pace — the actual per-frame rate oscillates around this (see the
// counting effect below), so it isn't exact.
const COUNT_DURATION = 3.3

export default function LoadingScreen({ ready, onDone }) {
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 900))
  const [rail, setRail] = useState(RAIL_DESKTOP)
  const [progress, setProgress] = useState(0)
  const [counting, setCounting] = useState(false)
  const [holding, setHolding] = useState(false)
  const [phase, setPhase] = useState('idle') // idle -> accelerate -> exit

  const screenRef = useRef(null)
  const titleRef = useRef(null)
  const labelRef = useRef(null)
  const railsPlayRef = useRef([])
  const jitterTweenRef = useRef(null)
  const progressRef = useRef(0)
  const finalBurstFiredRef = useRef(false)

  useEffect(() => {
    const compute = () => {
      setVh(window.innerHeight)
      setRail(window.matchMedia('(min-width: 768px)').matches ? RAIL_DESKTOP : RAIL_MOBILE)
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  // Title, then the loading label, slide/fade up into place one after the
  // other; the label kicks off percentage counting as soon as it lands.
  useEffect(() => {
    const tl = gsap.timeline({
      delay: 0.2,
      onComplete: () => setCounting(true),
    })
    tl.fromTo(
      titleRef.current,
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out' }
    ).fromTo(
      labelRef.current,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
      '-=0.2'
    )
    return () => tl.kill()
  }, [])

  const commitProgress = (v) => {
    progressRef.current = Math.max(progressRef.current, Math.min(v, 100))
    setProgress(progressRef.current)
  }

  // Percentage counts up continuously — it never stops between jumps like a
  // stepped counter would. Instead its rate itself oscillates (two layered
  // sine waves so the pattern doesn't feel mechanical): it slows down, then
  // speeds up, then slows again, always moving forward. The multiplier is
  // kept comfortably above zero so it never stalls or reverses.
  useEffect(() => {
    if (!counting) return
    let rafId
    let last = performance.now()
    let elapsed = 0
    const baseRate = HOLD_CEILING / COUNT_DURATION // %/sec average

    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      elapsed += dt
      const speed =
        1 + 0.55 * Math.sin(elapsed * 2.4) + 0.3 * Math.sin(elapsed * 5.3 + 1.2)
      const next = Math.min(HOLD_CEILING, progressRef.current + baseRate * Math.max(speed, 0.15) * dt)
      commitProgress(next)
      if (next < HOLD_CEILING) {
        rafId = requestAnimationFrame(tick)
      } else {
        setHolding(true)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [counting])

  // Once the count-up has reached its holding ceiling, wait for the real
  // site data to actually be ready, then ease the last stretch to 100 —
  // same continuous, no-stop feel, just a quicker final push.
  useEffect(() => {
    if (!holding || !ready || finalBurstFiredRef.current) return
    finalBurstFiredRef.current = true
    const proxy = { v: progressRef.current }
    gsap.to(proxy, {
      v: 100,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => commitProgress(proxy.v),
    })
  }, [holding, ready])

  useEffect(() => {
    if (progress >= 100 && phase === 'accelerate') setPhase('exit')
    else if (progress >= ACCELERATE_AT && phase === 'idle') setPhase('accelerate')
  }, [progress, phase])

  // Idle motion: both rails move together (they're driven off the same
  // shared `els` array via playRef) in big, slow, springy hops to an
  // absolute target — landing anywhere from RAIL_HOP_MIN_VH (up) to
  // RAIL_HOP_MAX_VH (down) of the viewport, e.g. up 30vh, then further up
  // to 70vh, then back down a bit. Targeting an absolute position (rather
  // than accumulating with +=) keeps the drift bounded no matter how long
  // the idle phase runs, so the rail buffer never gets exhausted.
  useEffect(() => {
    if (phase !== 'idle') return
    const els = railsPlayRef.current
    if (!els.length) return
    let cancelled = false

    function hop() {
      if (cancelled) return
      const target = (RAIL_HOP_MIN_VH + Math.random() * (RAIL_HOP_MAX_VH - RAIL_HOP_MIN_VH)) * vh
      const duration = 1.4 + Math.random() * 1.6
      jitterTweenRef.current = gsap.to(els, {
        y: target,
        duration,
        ease: 'elastic.out(1, 0.55)',
        onComplete: hop,
      })
    }
    hop()

    return () => {
      cancelled = true
      jitterTweenRef.current?.kill()
    }
  }, [phase, vh])

  // Rails race upward once we cross the acceleration threshold, then the
  // whole screen slides up off the top of the viewport to reveal the page
  // already sitting rendered underneath it.
  useEffect(() => {
    if (phase !== 'accelerate') return
    const els = railsPlayRef.current
    gsap.killTweensOf(els)
    gsap.to(els, {
      y: `-=${vh * RAIL_ACCELERATE_VH}`,
      duration: 0.65,
      ease: 'power3.in',
    })
  }, [phase, vh])

  useEffect(() => {
    if (phase !== 'exit') return
    gsap.to(screenRef.current, {
      y: '-100%',
      duration: 1.0,
      ease: 'power3.inOut',
      delay: 0.1,
      onComplete: onDone,
    })
  }, [phase, onDone])

  const pitch = rail.boxH + rail.gap
  const overscanAbove = Math.ceil((vh * RAIL_BUFFER_ABOVE_VH) / pitch)
  const overscanBelow = Math.ceil((vh * RAIL_BUFFER_BELOW_VH) / pitch)

  return (
    <div
      ref={screenRef}
      className="fixed inset-0 z-50 flex w-full items-stretch overflow-hidden bg-ink"
      style={{ height: vh }}
    >
      <FilmRail
        playRef={railsPlayRef}
        height={vh}
        overscanAbove={overscanAbove}
        overscanBelow={overscanBelow}
        {...rail}
      />

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <img
          ref={titleRef}
          src={latimerStudioLogo}
          alt="Latimer Studio"
          className="w-full max-w-155 select-none opacity-0 brightness-0 invert"
        />
        <p
          ref={labelRef}
          className="mt-6 font-embodiment text-sm tracking-[0.14em] text-cream/70 uppercase opacity-0 md:text-base"
        >
          Site Loading {Math.floor(progress)}%
        </p>
      </div>

      <FilmRail
        playRef={railsPlayRef}
        height={vh}
        overscanAbove={overscanAbove}
        overscanBelow={overscanBelow}
        {...rail}
      />
    </div>
  )
}

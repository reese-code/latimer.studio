import { useRef, useState, useCallback, useEffect } from 'react'
import { gsap } from 'gsap'
import HeroSlideCard, { BLOCK_W, BLOCK_H } from './HeroSlideCard'
import PopImage from './PopImage'

// Card sits this many px below and to the right of the raw cursor position.
const OFFSET = 4

// Position easing — how long the card takes to catch up to the raw cursor,
// and the ease curve, which is what gives it that slight lag/drag feel
// instead of snapping straight to the pointer.
const FOLLOW_DURATION = 0.45
const FOLLOW_EASE = 'power4.out'

// Tilt — the card tilts in 3D (rotateX/rotateY) toward the direction it's
// moving, proportional to cursor velocity measured once per animation frame
// (not per mousemove event — those fire with tiny, inconsistent deltas and
// made the tilt barely register), capped at MAX_TILT degrees. It's eased
// through its own quickTo, so it settles in and out smoothly, and naturally
// returns to flat when the cursor stops (velocity drops to 0).
const TILT_SENSITIVITY = 4
const MAX_TILT = 28
const TILT_DURATION = 0.45
const TILT_EASE = 'power3.out'
const TILT_PERSPECTIVE = 900

// Below this width the card doesn't follow the cursor at all — there's no
// hover on touch devices, and the hero shows a static HeroSlideCard in the
// mobile layout instead (see HomePage).
const DESKTOP_QUERY = '(min-width: 768px)'

// "multi" mode — a new image pops up (bottom right of the cursor) every time
// the cursor has travelled this far since the last one, at most MAX_POPS at once.
const POP_DISTANCE = 110
const MAX_POPS = 8
const POP_W = BLOCK_W * 0.75
const POP_H = BLOCK_H * 0.75

// ---------------------------------------------------------------------------
// CursorImageTrail — wraps a hoverable area. On desktop widths, a single
// HeroSlideCard tracks the cursor (offset a few px down-right) and tilts
// toward its direction of travel. Below the md breakpoint it's a plain
// passthrough — no listeners, no floating card — since the mobile layout
// renders its own static HeroSlideCard in flow instead.
// ---------------------------------------------------------------------------
export default function CursorImageTrail({ images, children, className = '', mode = 'movement' }) {
  const containerRef = useRef(null)
  const cardRef = useRef(null)
  const targetRef = useRef(null)
  const lastFramePosRef = useRef(null)
  const rafRef = useRef(null)
  const setXRef = useRef(null)
  const setYRef = useRef(null)
  const setRotateXRef = useRef(null)
  const setRotateYRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [pops, setPops] = useState([])
  const popIdRef = useRef(0)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const lastPopPosRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => {
      setIsDesktop(mql.matches)
      if (!mql.matches) setVisible(false)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // (Re)creates the quickTo setters whenever the card mounts, and starts a
  // rAF loop that samples cursor velocity once per frame to drive the tilt
  // — sampling per animation frame (rather than per mousemove event, which
  // fires with tiny/inconsistent deltas) is what makes the tilt read
  // clearly instead of barely registering.
  useEffect(() => {
    if (mode !== 'movement' || !visible || !isDesktop || !cardRef.current) return

    gsap.set(cardRef.current, { transformPerspective: TILT_PERSPECTIVE, transformStyle: 'preserve-3d' })

    // Start at the cursor, not the element's static position (bottom of the
    // container), so the card doesn't have to travel in from far away.
    if (targetRef.current) {
      gsap.set(cardRef.current, { left: targetRef.current.x + OFFSET, top: targetRef.current.y + OFFSET })
    }

    setXRef.current = gsap.quickTo(cardRef.current, 'left', { duration: FOLLOW_DURATION, ease: FOLLOW_EASE })
    setYRef.current = gsap.quickTo(cardRef.current, 'top', { duration: FOLLOW_DURATION, ease: FOLLOW_EASE })
    setRotateXRef.current = gsap.quickTo(cardRef.current, 'rotationX', { duration: TILT_DURATION, ease: TILT_EASE })
    setRotateYRef.current = gsap.quickTo(cardRef.current, 'rotationY', { duration: TILT_DURATION, ease: TILT_EASE })
    lastFramePosRef.current = targetRef.current ? { ...targetRef.current } : null

    const tick = () => {
      if (targetRef.current) {
        setXRef.current(targetRef.current.x + OFFSET)
        setYRef.current(targetRef.current.y + OFFSET)

        if (lastFramePosRef.current) {
          const dx = targetRef.current.x - lastFramePosRef.current.x
          const dy = targetRef.current.y - lastFramePosRef.current.y
          const tiltY = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * TILT_SENSITIVITY))
          const tiltX = Math.max(-MAX_TILT, Math.min(MAX_TILT, -dy * TILT_SENSITIVITY))
          setRotateYRef.current(tiltY)
          setRotateXRef.current(tiltX)
        }
        lastFramePosRef.current = { ...targetRef.current }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [visible, isDesktop, mode])

  const updateTarget = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect()
    targetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    if (modeRef.current === 'multi') {
      const { x, y } = targetRef.current
      const last = lastPopPosRef.current
      if (!last || Math.hypot(x - last.x, y - last.y) >= POP_DISTANCE) {
        lastPopPosRef.current = { x, y }
        popIdRef.current += 1
        const id = popIdRef.current
        setPops((p) => [...p.slice(-(MAX_POPS - 1)), { id, x: x + OFFSET, y: y + OFFSET }])
      }
    }
  }, [])

  const removePop = useCallback((id) => setPops((p) => p.filter((x) => x.id !== id)), [])

  const handleMouseEnter = useCallback(
    (e) => {
      if (!isDesktop) return
      updateTarget(e)
      setVisible(true)
    },
    [isDesktop, updateTarget]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDesktop) return
      updateTarget(e)
    },
    [isDesktop, updateTarget]
  )

  const handleMouseLeave = useCallback(() => {
    // Freeze in place rather than disappearing — keeps the card at the last
    // known cursor position instead of popping out when the cursor exits
    // the container (e.g. at its edges).
  }, [])

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
    >
      {children}

      {isDesktop && mode === 'multi' &&
        pops.map((p) => (
          <PopImage
            key={p.id}
            images={images}
            index={p.id}
            onDone={() => removePop(p.id)}
            className="pointer-events-none absolute z-50"
            style={{ left: p.x, top: p.y, width: POP_W, height: POP_H }}
          />
        ))}

      {isDesktop && visible && mode === 'movement' && (
        <HeroSlideCard
          ref={cardRef}
          images={images}
          className="pointer-events-none absolute z-50"
          style={{ width: BLOCK_W, height: BLOCK_H }}
        />
      )}
    </div>
  )
}

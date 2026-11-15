import { useEffect, useRef, useState } from 'react'
import PopImage from './PopImage'

const POP_INTERVAL = 380
// Pops stack in place; once there are this many, the oldest is removed.
const MAX_STACK = 4
// Largest tilt PopImage can land on (MAX_ROTATE) — the pop is sized so its
// most-rotated corner just touches the slot edge, leaving the page's padding.
const MAX_TILT = (7 * Math.PI) / 180
// Mobile pops slide up from further below, springing into place with the tilt.
const RISE = 40
// Each pop uses the aspect ratio (w / h) set per image in Sanity (Home → Hero
// images → Pop-up shape), same as the desktop cursor trail.
const POP_RATIOS = { '3:4': 3 / 4, '1:1': 1, '4:3': 4 / 3 }
const DEFAULT_RATIO = '3:4'
const ratioFor = (ratios, id) => POP_RATIOS[ratios?.length ? ratios[id % ratios.length] : DEFAULT_RATIO] ?? POP_RATIOS[DEFAULT_RATIO]

// ---------------------------------------------------------------------------
// PopSlideCard — mobile version of the "multi" option. Occupies the same slot
// as the desktop pops, but stacks popped images in place on its own timer (no cursor).
// ---------------------------------------------------------------------------
export default function PopSlideCard({ images, aspectRatios, className = '' }) {
  const [pops, setPops] = useState(() => [{ id: 0, ratio: ratioFor(aspectRatios, 0) }])
  const idRef = useRef(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const slotRef = useRef(null)
  const [slot, setSlot] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = slotRef.current
    if (!el) return
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect()
      if (w && h) setSlot({ w, h })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Scrolled past the hero: stop popping and hide until it's back on screen.
  useEffect(() => {
    const el = slotRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (paused || !inView) return
    const timer = setInterval(() => {
      idRef.current += 1
      const id = idRef.current
      setPops((p) => [...p.slice(-(MAX_STACK - 1)), { id, ratio: ratioFor(aspectRatios, id) }])
    }, POP_INTERVAL)
    return () => clearInterval(timer)
  }, [paused, inView, aspectRatios])

  // Largest pop of the given ratio whose rotated bounding box fits in the slot.
  const popSize = (ratio) => {
    const sin = Math.sin(MAX_TILT)
    const cos = Math.cos(MAX_TILT)
    const ph = Math.min(slot.w / (ratio * cos + sin), slot.h / (ratio * sin + cos))
    return { width: ph * ratio, height: ph }
  }

  // Tap toggles pause/play.
  return (
    <div
      ref={slotRef}
      className={`relative ${className}`}
      style={{ visibility: inView ? 'visible' : 'hidden' }}
      onClick={() => setPaused((p) => !p)}
    >
      {pops.map((p) => (
        <PopImage
          key={p.id}
          images={images}
          index={p.id}
          stay
          rise={RISE}
          gentle
          className="absolute inset-0 m-auto"
          style={popSize(p.ratio)}
        />
      ))}
    </div>
  )
}

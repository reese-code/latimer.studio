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
// Each pop picks a random aspect ratio (w / h): 1:1, 4:3 or 3:4.
const POP_RATIOS = [1, 4 / 3, 3 / 4]
const randomRatio = () => POP_RATIOS[Math.floor(Math.random() * POP_RATIOS.length)]

// ---------------------------------------------------------------------------
// PopSlideCard — mobile version of the "multi" option. Occupies the same slot
// as the desktop pops, but stacks popped images in place on its own timer (no cursor).
// ---------------------------------------------------------------------------
export default function PopSlideCard({ images, className = '' }) {
  const [pops, setPops] = useState(() => [{ id: 0, ratio: randomRatio() }])
  const idRef = useRef(0)
  const [paused, setPaused] = useState(false)
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

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      idRef.current += 1
      const id = idRef.current
      setPops((p) => [...p.slice(-(MAX_STACK - 1)), { id, ratio: randomRatio() }])
    }, POP_INTERVAL)
    return () => clearInterval(timer)
  }, [paused])

  // Largest pop of the given ratio whose rotated bounding box fits in the slot.
  const popSize = (ratio) => {
    const sin = Math.sin(MAX_TILT)
    const cos = Math.cos(MAX_TILT)
    const ph = Math.min(slot.w / (ratio * cos + sin), slot.h / (ratio * sin + cos))
    return { width: ph * ratio, height: ph }
  }

  // Tap toggles pause/play.
  return (
    <div ref={slotRef} className={`relative ${className}`} onClick={() => setPaused((p) => !p)}>
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

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

// ---------------------------------------------------------------------------
// PopSlideCard — mobile version of the "multi" option. Occupies the same slot
// as the desktop pops, but stacks popped images in place on its own timer (no cursor).
// ---------------------------------------------------------------------------
export default function PopSlideCard({ images, className = '' }) {
  const [pops, setPops] = useState([{ id: 0 }])
  const idRef = useRef(0)
  const [paused, setPaused] = useState(false)
  const slotRef = useRef(null)
  const [scale, setScale] = useState(0.82)

  useEffect(() => {
    const el = slotRef.current
    if (!el) return
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect()
      if (!w || !h) return
      const sin = Math.sin(MAX_TILT)
      const cos = Math.cos(MAX_TILT)
      // Rotated bounding box of a (s*w) x (s*h) rect must fit inside w x h.
      setScale(Math.min(w / (w * cos + h * sin), h / (w * sin + h * cos)))
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
      setPops((p) => [...p.slice(-(MAX_STACK - 1)), { id }])
    }, POP_INTERVAL)
    return () => clearInterval(timer)
  }, [paused])

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
          style={{ width: `${scale * 100}%`, height: `${scale * 100}%` }}
        />
      ))}
    </div>
  )
}

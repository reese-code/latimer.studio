import { useRef, useState, useCallback, useEffect } from 'react'
import PopImage from './PopImage'

// Pops sit this many px below and to the right of the raw cursor position.
const OFFSET = 4

// Below this width there's no hover (touch), so it's a plain passthrough —
// the mobile layout renders its own PopSlideCard in flow instead.
const DESKTOP_QUERY = '(min-width: 768px)'

// A new image pops up (bottom right of the cursor) every time the cursor has
// travelled this far since the last one, at most MAX_POPS at once.
const POP_DISTANCE = 70
const MAX_POPS = 8
const POP_W = (370 / 3) * 2 * 0.75
const POP_H = (450 / 3) * 2 * 0.75

// ---------------------------------------------------------------------------
// CursorImageTrail — wraps a hoverable area. On desktop widths, images pop up
// near the cursor as it moves. Below the md breakpoint it's a plain
// passthrough — no listeners, no pops.
// ---------------------------------------------------------------------------
export default function CursorImageTrail({ images, children, className = '' }) {
  const containerRef = useRef(null)
  const popIdRef = useRef(0)
  const lastPopPosRef = useRef(null)
  const [pops, setPops] = useState([])
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY)
    const onChange = () => setIsDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDesktop) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const last = lastPopPosRef.current
      if (!last || Math.hypot(x - last.x, y - last.y) >= POP_DISTANCE) {
        lastPopPosRef.current = { x, y }
        popIdRef.current += 1
        const id = popIdRef.current
        setPops((p) => [...p.slice(-(MAX_POPS - 1)), { id, x: x + OFFSET, y: y + OFFSET }])
      }
    },
    [isDesktop]
  )

  const removePop = useCallback((id) => setPops((p) => p.filter((x) => x.id !== id)), [])

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className={`relative ${className}`}>
      {children}

      {isDesktop &&
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
    </div>
  )
}

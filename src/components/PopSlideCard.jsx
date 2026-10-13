import { useEffect, useRef, useState } from 'react'
import PopImage from './PopImage'

const POP_INTERVAL = 800
// Pops stack in place; once there are this many, the oldest is removed.
const MAX_STACK = 4
// The pop is scaled down inside the slot so the slot (and its spacing to the
// text above/below) stays the same size as the movement option's card.
const POP_SCALE = 0.82

// ---------------------------------------------------------------------------
// PopSlideCard — mobile version of the "multi" option. Occupies the same slot
// as HeroSlideCard, but stacks popped images in place on its own timer (no cursor).
// ---------------------------------------------------------------------------
export default function PopSlideCard({ images, className = '' }) {
  const [pops, setPops] = useState([{ id: 0 }])
  const idRef = useRef(0)

  useEffect(() => {
    const timer = setInterval(() => {
      idRef.current += 1
      const id = idRef.current
      setPops((p) => [...p.slice(-(MAX_STACK - 1)), { id }])
    }, POP_INTERVAL)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`relative ${className}`}>
      {pops.map((p) => (
        <PopImage
          key={p.id}
          images={images}
          index={p.id}
          stay
          className="absolute inset-0 m-auto"
          style={{ width: `${POP_SCALE * 100}%`, height: `${POP_SCALE * 100}%` }}
        />
      ))}
    </div>
  )
}

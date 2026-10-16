import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const RISE_DISTANCE = 18
const START_ROTATE = -5
const MIN_ROTATE = 2
const MAX_ROTATE = 7
// Chance that a pop leans left instead of right.
const LEFT_CHANCE = 0.45
const SPRING_DURATION = 0.55
const HOLD = 0.45
const FADE_OUT = 0.22

// ---------------------------------------------------------------------------
// PopImage — a single image that pops in: appears at full size, then springs
// up while rotating from a slight left tilt to a random right-leaning angle, then fades out and
// calls onDone so the parent can unmount it. Positioning is up to the caller
// (via className/style).
// ---------------------------------------------------------------------------
export default function PopImage({ images, index, onDone, stay = false, rise = RISE_DISTANCE, gentle = false, className = '', style }) {
  const ref = useRef(null)

  const image = images?.length ? images[index % images.length] : null

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Starts tilted slightly the opposite way, springs up and settles at a
    // random angle — usually leaning right, sometimes left.
    const dir = Math.random() < LEFT_CHANCE ? -1 : 1
    const rotation = gsap.utils.random(MIN_ROTATE, MAX_ROTATE) * dir
    gsap.set(el, { opacity: 1, y: rise, rotation: START_ROTATE * dir })
    const tl = gsap.timeline({ onComplete: () => onDone?.() })
    tl.to(el, { y: 0, duration: SPRING_DURATION, ease: gentle ? 'elastic.out(1, 0.7)' : 'elastic.out(1.1, 0.45)' }, 0)
    tl.to(el, { rotation, duration: SPRING_DURATION, ease: gentle ? 'back.out(1.2)' : 'back.out(2.5)' }, 0)
    // `stay` pops keep their place; the parent decides when to remove them.
    if (!stay) tl.to(el, { opacity: 0, duration: FADE_OUT, ease: 'power1.in' }, SPRING_DURATION + HOLD)
    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={`overflow-hidden opacity-0 ${image ? 'shadow-[0_2px_8px_rgba(0,0,0,0.08)]' : ''} ${className}`}
      style={{ borderRadius: 16, ...style }}
    >
      {image && <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />}
    </div>
  )
}

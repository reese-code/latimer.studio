import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

// Placeholder colors stand in for `images` until real art is set in Sanity
// (siteSettings.heroTrailImages) — same palette as HeroSlideCard.
const PLACEHOLDER_COLORS = ['#722f37', '#aa3bff', '#1f6f54', '#c9742d', '#2457c5']

const RISE_DISTANCE = 18
const START_ROTATE = -5
const MIN_ROTATE = 2
const MAX_ROTATE = 12
// Chance that a pop leans left instead of right.
const LEFT_CHANCE = 0.35
const SPRING_DURATION = 0.55
const HOLD = 0.45
const FADE_OUT = 0.22

// ---------------------------------------------------------------------------
// PopImage — a single image that pops in: appears at full size, then springs
// up while rotating from a slight left tilt to a random right-leaning angle, then fades out and
// calls onDone so the parent can unmount it. Positioning is up to the caller
// (via className/style).
// ---------------------------------------------------------------------------
export default function PopImage({ images, index, onDone, stay = false, className = '', style }) {
  const ref = useRef(null)

  const image = images?.length ? images[index % images.length] : null
  const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length]

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Starts tilted slightly the opposite way, springs up and settles at a
    // random angle — usually leaning right, sometimes left.
    const dir = Math.random() < LEFT_CHANCE ? -1 : 1
    const rotation = gsap.utils.random(MIN_ROTATE, MAX_ROTATE) * dir
    gsap.set(el, { opacity: 1, y: RISE_DISTANCE, rotation: START_ROTATE * dir })
    const tl = gsap.timeline({ onComplete: () => onDone?.() })
    tl.to(el, { y: 0, duration: SPRING_DURATION, ease: 'elastic.out(1.1, 0.45)' }, 0)
    tl.to(el, { rotation, duration: SPRING_DURATION, ease: 'back.out(2.5)' }, 0)
    // `stay` pops keep their place; the parent decides when to remove them.
    if (!stay) tl.to(el, { opacity: 0, duration: FADE_OUT, ease: 'power1.in' }, SPRING_DURATION + HOLD)
    return () => tl.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      className={`overflow-hidden opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${className}`}
      style={{ borderRadius: 16, backgroundColor: image ? undefined : color, ...style }}
    >
      {image && <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import LetsTalkButton from './LetsTalkButton'

// 500×700 scaled down 20% on desktop, 40% on mobile.
const SIZES = { desktop: { w: 400, h: 560 }, mobile: { w: 300, h: 420 } }
const GAP = 20
const SPEED = 40 // px per second
const COPIES = 3

const DEFAULT_PARAGRAPHS = [
  'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
]
const DEFAULT_SLIDES = ['#722f37', '#1a1a1a', '#c9b79c', '#3b5249'].map((color) => ({ color }))

// The track holds 3 copies of the slides. Auto-scroll advances one copy's
// width (33.33% of the track) and then snaps back to the start with no
// transition, which is invisible because the copies are identical. Dragging
// uses the same wrap, so swiping backwards from the start lands on the last slide.
function Carousel({ slides }) {
  const trackRef = useRef(null)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const { w, h } = mobile ? SIZES.mobile : SIZES.desktop
  const n = slides.length
  const period = n * (w + GAP)

  useEffect(() => {
    const track = trackRef.current
    const viewport = track.parentElement
    let offset = 0
    let dragging = false
    let startX = 0
    let startOffset = 0
    let last = performance.now()
    let raf
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const apply = () => {
      offset = ((offset % period) + period) % period
      // Sit on the middle copy so there is always content on both sides.
      track.style.transform = `translate3d(${-(period + offset)}px,0,0)`
    }
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      if (!dragging && !reduce) {
        offset += SPEED * dt
        apply()
      }
      raf = requestAnimationFrame(tick)
    }
    const down = (e) => {
      dragging = true
      startX = e.clientX
      startOffset = offset
      viewport.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!dragging) return
      offset = startOffset - (e.clientX - startX)
      apply()
    }
    const up = () => {
      dragging = false
    }
    const wheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      offset += e.deltaX
      apply()
    }
    apply()
    raf = requestAnimationFrame(tick)
    viewport.addEventListener('pointerdown', down)
    viewport.addEventListener('pointermove', move)
    viewport.addEventListener('pointerup', up)
    viewport.addEventListener('pointercancel', up)
    viewport.addEventListener('wheel', wheel, { passive: false })
    return () => {
      cancelAnimationFrame(raf)
      viewport.removeEventListener('pointerdown', down)
      viewport.removeEventListener('pointermove', move)
      viewport.removeEventListener('pointerup', up)
      viewport.removeEventListener('pointercancel', up)
      viewport.removeEventListener('wheel', wheel)
    }
  }, [period])

  return (
    <div className="-mx-2 mt-10 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing md:-mx-4 md:mt-14">
      <div ref={trackRef} className="flex will-change-transform" style={{ gap: GAP }}>
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          slides.map((s, i) => (
            <div
              key={`${c}-${i}`}
              aria-hidden={c !== 1 || undefined}
              className="shrink-0 overflow-hidden rounded-xl"
              style={{ width: w, height: h, background: s.color || '#1a1a1a' }}
            >
              {s.image && (
                <img src={s.image} alt="" draggable={false} className="h-full w-full object-cover" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function AboutSection({ about }) {
  const paragraphs = about?.paragraphs?.length ? about.paragraphs : DEFAULT_PARAGRAPHS
  const slides = about?.slides?.length ? about.slides : DEFAULT_SLIDES

  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      <div className="flex items-center gap-3 text-ink/60 md:gap-5">
        <span className="h-0.5 w-8 bg-current md:w-15" />
        <h2 className="text-body m-0 uppercase">{about?.label || 'About the Studio'}</h2>
        <span className="h-0.5 flex-1 bg-current" />
      </div>

      <div className="mx-auto mt-10 max-w-[1000px] md:mt-16">
        {paragraphs.map((p, i) => (
          <h3 key={i} className="text-h3 m-0 mb-4 text-ink">
            {p}
          </h3>
        ))}
        <LetsTalkButton label={about?.buttonLabel || 'Learn more'} to={about?.buttonHref || '/info'} />
      </div>

      <Carousel slides={slides} />
    </section>
  )
}

import { forwardRef, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// Card size (desktop/default) — exported so CursorImageTrail can size the
// cursor-following wrapper identically.
export const BLOCK_W = (370 / 3) * 2
export const BLOCK_H = (450 / 3) * 2

// How long each slide (image/color) stays active before advancing.
const CHANGE_INTERVAL = 2000

// Bottom progress row layout.
const CARD_PADDING_X = 14
const CARD_PADDING_BOTTOM = 12
const DOT_SIZE = 6
const BAR_HEIGHT = 4
const SEGMENT_GAP = 6

// Placeholder colors stand in for `images` until real art is set in Sanity
// (siteSettings.heroTrailImages) — cycled in order.
const PLACEHOLDER_COLORS = ['#722f37', '#aa3bff', '#1f6f54', '#c9742d', '#2457c5']

// ---------------------------------------------------------------------------
// HeroSlideCard — the image/color card with the stories-style progress row
// along the bottom (active slide fills as a bar, the rest sit as dots).
// Presentational + self-timing (owns its own advance timer); has no opinion
// on where it's positioned, so the same card can be dropped into the
// cursor-following desktop wrapper (CursorImageTrail) or placed statically
// in the mobile layout. The progress bar's active segment is a flex-1 child
// rather than a precomputed pixel width, so the card can be sized with a
// fluid `style` (e.g. clamp()/vw) and the bar still fills correctly.
// ---------------------------------------------------------------------------
const HeroSlideCard = forwardRef(function HeroSlideCard({ images, style, className = '' }, ref) {
  const [activeIndex, setActiveIndex] = useState(0)
  const fillRef = useRef(null)
  const timerRef = useRef(null)

  const slideCount = images?.length ? images.length : PLACEHOLDER_COLORS.length
  const image = images?.length ? images[activeIndex % images.length] : null
  const color = PLACEHOLDER_COLORS[activeIndex % PLACEHOLDER_COLORS.length]

  useEffect(() => {
    if (fillRef.current) {
      gsap.set(fillRef.current, { width: '0%' })
      gsap.to(fillRef.current, { width: '100%', duration: CHANGE_INTERVAL / 1000, ease: 'none' })
    }

    timerRef.current = setTimeout(() => {
      setActiveIndex((i) => (i + 1) % slideCount)
    }, CHANGE_INTERVAL)

    return () => clearTimeout(timerRef.current)
  }, [activeIndex, slideCount])

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${className}`}
      style={{
        borderRadius: 16,
        backgroundColor: image ? undefined : color,
        ...style,
      }}
    >
      {image && <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />}

      <div
        className="absolute inset-x-0 bottom-0 h-1/4"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0))' }}
      />

      <div
        className="absolute inset-x-0 bottom-0 flex items-center"
        style={{
          paddingLeft: CARD_PADDING_X,
          paddingRight: CARD_PADDING_X,
          paddingBottom: CARD_PADDING_BOTTOM,
          gap: SEGMENT_GAP,
        }}
      >
        {Array.from({ length: slideCount }).map((_, i) =>
          i === activeIndex ? (
            <div
              key={i}
              className="relative min-w-0 flex-1 overflow-hidden rounded-full bg-white/30 transition-all duration-300"
              style={{ height: BAR_HEIGHT }}
            >
              <div ref={fillRef} className="absolute left-0 top-0 h-full w-0 rounded-full bg-white" />
            </div>
          ) : (
            <div
              key={i}
              className="shrink-0 rounded-full bg-white/40 transition-all duration-300"
              style={{ width: DOT_SIZE, height: DOT_SIZE }}
            />
          )
        )}
      </div>
    </div>
  )
})

export default HeroSlideCard

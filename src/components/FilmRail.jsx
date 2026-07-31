import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// Vertical film-tape sprocket rail. Takes an explicit `height` (measured by
// the page from its content column, see `useRailHeight` below) rather than
// self-measuring via ResizeObserver — self-measuring a box whose own content
// height depends on the measurement is a feedback loop (each resize adds
// more cells, which grows the box, which triggers another resize...).
// Box size, corner radius, gap, and outer padding are all configurable so
// desktop and mobile can use different scales of the same rail.
export default function FilmRail({ playRef, height, boxW, boxH, radius, gap, pad }) {
  const innerRef = useRef(null)
  const pitch = boxH + gap
  const count = Math.max(3, Math.floor((height - pad * 2) / pitch))

  // Register this rail's inner strip so the page-load timeline can drive
  // every rail on the page in lockstep.
  useLayoutEffect(() => {
    if (!playRef) return
    const el = innerRef.current
    if (!el) return
    playRef.current = [...(playRef.current || []), el]
    return () => {
      playRef.current = (playRef.current || []).filter((n) => n !== el)
    }
  }, [playRef])

  return (
    <div
      className="relative shrink-0 overflow-hidden"
      style={{ width: boxW + pad * 2, height, padding: pad }}
    >
      <div
        ref={innerRef}
        className="flex flex-col items-center justify-between"
        style={{ gap }}
      >
        {Array.from({ length: count + 3 }).map((_, i) => (
          <span
            key={i}
            className="shrink-0 bg-cream"
            style={{ width: boxW, height: boxH, borderRadius: radius }}
          />
        ))}
      </div>
    </div>
  )
}

// Measures a content column's height (ResizeObserver) so both side rails
// can be told an explicit pixel height to match, instead of stretching and
// self-measuring (see the feedback-loop note above).
export function useRailHeight() {
  const contentRef = useRef(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const compute = () => setHeight(el.getBoundingClientRect().height)
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [contentRef, height]
}

// Film-tape entrance: rails start shifted up above the frame and drop into
// place — slow start, fast middle, slow stop — settling within ~2.5s of the
// page loading. Call once from the page component with the ref shared by
// every FilmRail on the page.
export function useFilmRailEntrance(railsRef, { pitchOffset } = {}) {
  useLayoutEffect(() => {
    const els = railsRef.current
    if (!els.length) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        els,
        { y: -pitchOffset },
        { y: 0, duration: 2.4, ease: 'power3.inOut' }
      )
    })
    return () => ctx.revert()
  }, [railsRef, pitchOffset])
}

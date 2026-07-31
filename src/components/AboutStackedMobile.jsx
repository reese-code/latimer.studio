import { useRef } from 'react'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmFooter from './FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from './FilmRail'

const ABOUT_COPY =
  "Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people. We're not building websites; we're breaking the noise in the sea of sameness with world class design and branding."

// Mobile rail scale — much smaller cells than desktop.
const RAIL = { boxW: 8, boxH: 14, radius: 2, gap: 6, pad: 4 }

export default function AboutStackedMobile() {
  const railsRef = useRef([])
  const [contentRef, railHeight] = useRailHeight()
  useFilmRailEntrance(railsRef, { pitchOffset: (RAIL.boxH + RAIL.gap) * 3 })

  return (
    <div className="flex min-h-screen w-full bg-ink">
      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />

      <div ref={contentRef} className="flex min-h-screen flex-1 flex-col">
        <div className="flex flex-col items-center gap-8 py-10">
          <img
            src={latimerStudioLogo}
            alt="Latimer Studio"
            className="w-56 select-none brightness-0 invert"
          />
          <p className="w-full font-sans text-[32px] font-medium uppercase leading-tight tracking-[0.02em] text-cream">
            {ABOUT_COPY}
          </p>
          <div className="aspect-4/3 w-full rounded-sm bg-cream" />
        </div>

        <div className="mt-15">
          <FilmFooter variant="ink" />
        </div>
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

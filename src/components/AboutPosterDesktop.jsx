import { useRef } from 'react'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmFooter from './FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from './FilmRail'

const ABOUT_COPY =
  "Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people. We're not building websites; we're breaking the noise in the sea of sameness with world class design and branding."

// Desktop rail scale — bigger cells than mobile, per spec: 40x55 boxes,
// 8px corner radius, 20px gap between cells, 20px padding around the strip.
const RAIL = { boxW: 40, boxH: 55, radius: 8, gap: 20, pad: 20 }

export default function AboutPosterDesktop() {
  const railsRef = useRef([])
  const [contentRef, railHeight] = useRailHeight()
  useFilmRailEntrance(railsRef, { pitchOffset: (RAIL.boxH + RAIL.gap) * 3 })

  return (
    <div className="flex min-h-screen w-full bg-ink">
      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />

      <div ref={contentRef} className="flex min-h-screen flex-1 flex-col">
        <div className="flex flex-col py-10">
          <img
            src={latimerStudioLogo}
            alt="Latimer Studio"
            className="mx-auto mt-4 w-full max-w-225 select-none brightness-0 invert"
          />

          <div className="mt-14 flex w-full flex-row items-start gap-12">
            <p className="min-w-0 flex-1 font-sans text-[48px] font-medium uppercase leading-[1.2] tracking-[0.01em] text-cream">
              {ABOUT_COPY}
            </p>
            <div className="aspect-4/3 w-full flex-1 rounded-sm bg-cream" />
          </div>
        </div>

        <div className="mt-20">
          <FilmFooter variant="ink" />
        </div>
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

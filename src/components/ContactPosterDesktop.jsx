import { useRef } from 'react'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmFooter from './FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from './FilmRail'
import TypeformEmbed from './TypeformEmbed'

// Desktop rail scale — matches the About page's film-tape sprocket rails,
// 40x55 boxes, 8px corner radius, 20px gap, 20px padding.
const RAIL = { boxW: 40, boxH: 55, radius: 8, gap: 20, pad: 20 }

export default function ContactPosterDesktop() {
  const railsRef = useRef([])
  const [contentRef, railHeight] = useRailHeight()
  useFilmRailEntrance(railsRef, { pitchOffset: (RAIL.boxH + RAIL.gap) * 3 })

  return (
    <div className="flex min-h-screen w-full bg-ink">
      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />

      <div ref={contentRef} className="flex min-h-screen flex-1 flex-col">
        <div className="flex flex-col items-center py-16">
          <img
            src={latimerStudioLogo}
            alt="Latimer Studio"
            className="mx-auto mt-4 w-full max-w-225 select-none brightness-0 invert"
          />

          <div className="mt-10 w-full" style={{ minHeight: 700 }}>
            <TypeformEmbed className="h-full w-full" style={{ minHeight: 700 }} />
          </div>
        </div>

        <FilmFooter variant="ink" />
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

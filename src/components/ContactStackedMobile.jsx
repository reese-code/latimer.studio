import { useRef } from 'react'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmFooter from './FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from './FilmRail'
import TypeformEmbed from './TypeformEmbed'
import { useSiteData } from '../hooks/useSiteData'

// Mobile rail scale — matches the About page's mobile film-tape rails.
const RAIL = { boxW: 8, boxH: 14, radius: 2, gap: 6, pad: 4 }

export default function ContactStackedMobile() {
  const { siteSettings } = useSiteData()
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

          <div className="w-full" style={{ minHeight: 600 }}>
            <TypeformEmbed id={siteSettings?.typeformId} className="h-full w-full" style={{ minHeight: 600 }} />
          </div>
        </div>

        <FilmFooter variant="ink" />
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

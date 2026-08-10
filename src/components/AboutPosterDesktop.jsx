import { useRef } from 'react'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import FilmFooter from './FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from './FilmRail'
import { useSiteData } from '../hooks/useSiteData'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'

// Desktop rail scale — bigger cells than mobile, per spec: 40x55 boxes,
// 8px corner radius, 20px gap between cells, 20px padding around the strip.
const RAIL = { boxW: 40, boxH: 55, radius: 8, gap: 20, pad: 20 }

export default function AboutPosterDesktop() {
  const { siteSettings } = useSiteData()
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
              {siteSettings?.aboutCopy}
            </p>
            <div className="aspect-4/3 w-full flex-1 overflow-hidden rounded-sm bg-cream">
              {siteSettings?.aboutImage && (
                <img
                  src={optimizedImageUrl(siteSettings.aboutImage, { width: 1000 })}
                  srcSet={srcSetFor(siteSettings.aboutImage, [480, 768, 1000, 1500])}
                  sizes="50vw"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full select-none object-cover"
                />
              )}
            </div>
          </div>
        </div>

        <FilmFooter variant="ink" />

      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

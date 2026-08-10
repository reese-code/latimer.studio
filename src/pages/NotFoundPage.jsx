import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import FilmRail, { useFilmRailEntrance, useRailHeight } from '../components/FilmRail'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'

// Desktop rail scale — matches AboutPosterDesktop/ContactPosterDesktop.
const RAIL = { boxW: 40, boxH: 55, radius: 8, gap: 20, pad: 20 }
// Mobile rail scale — matches AboutStackedMobile/ContactStackedMobile.
const RAIL_MOBILE = { boxW: 8, boxH: 14, radius: 2, gap: 6, pad: 4 }

// A real 404 — same page chrome (film rails, wordmark, footer) as
// About/Contact rather than a bare error string, so a bad URL still feels
// like part of the site. Rendered both for genuinely unmatched routes
// (see App.jsx's catch-all) and in place for an invalid project slug (see
// ProjectPage.jsx), with `noindex` set via useDocumentHead so it never
// gets indexed under whatever bad URL triggered it.
export default function NotFoundPage() {
  useDocumentHead({
    title: 'Page Not Found — Latimer Studio',
    description: "The page you're looking for doesn't exist.",
    noindex: true,
  })

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  return (
    <div className="min-h-screen w-full bg-ink">
      <div className="md:hidden">
        <NotFoundStackedMobile />
      </div>
      <div className="hidden md:block">
        <NotFoundDesktop />
      </div>
      <TicketMenu />
    </div>
  )
}

function NotFoundMessage() {
  const navigate = useNavigate()
  return (
    <>
      <h1 className="text-center font-heading text-[56px] font-light leading-none tracking-normal text-cream md:text-[88px]">
        Page Not Found
      </h1>
      <p className="mt-4 text-center font-embodiment text-base uppercase tracking-[0.14em] text-cream/70">
        The page you're looking for doesn't exist.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="btn-scoop mt-8 inline-block cursor-pointer whitespace-nowrap border-cream px-6 py-3 font-embodiment text-base tracking-[0.14em] text-cream transition-colors duration-200 ease-out hover:bg-white hover:text-ink"
      >
        Return to Home
      </button>
    </>
  )
}

function NotFoundDesktop() {
  const railsRef = useRef([])
  const [contentRef, railHeight] = useRailHeight()
  useFilmRailEntrance(railsRef, { pitchOffset: (RAIL.boxH + RAIL.gap) * 3 })

  return (
    <div className="flex min-h-screen w-full bg-ink">
      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />

      <div ref={contentRef} className="flex min-h-screen flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <img
            src={latimerStudioLogo}
            alt="Latimer Studio"
            className="mx-auto mt-4 w-full max-w-225 select-none brightness-0 invert"
          />
          <div className="mt-16 flex flex-col items-center">
            <NotFoundMessage />
          </div>
        </div>

        <FilmFooter variant="ink" />
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL} />
    </div>
  )
}

function NotFoundStackedMobile() {
  const railsRef = useRef([])
  const [contentRef, railHeight] = useRailHeight()
  useFilmRailEntrance(railsRef, { pitchOffset: (RAIL_MOBILE.boxH + RAIL_MOBILE.gap) * 3 })

  return (
    <div className="flex min-h-screen w-full bg-ink">
      <FilmRail playRef={railsRef} height={railHeight} {...RAIL_MOBILE} />

      <div ref={contentRef} className="flex min-h-screen flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
          <img
            src={latimerStudioLogo}
            alt="Latimer Studio"
            className="w-56 select-none brightness-0 invert"
          />
          <NotFoundMessage />
        </div>

        <FilmFooter variant="ink" />
      </div>

      <FilmRail playRef={railsRef} height={railHeight} {...RAIL_MOBILE} />
    </div>
  )
}


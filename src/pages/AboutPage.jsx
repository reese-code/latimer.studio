import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import AboutPosterDesktop from '../components/AboutPosterDesktop'
import AboutStackedMobile from '../components/AboutStackedMobile'
import { getLenis } from '../hooks/useLenis'

export default function AboutPage() {
  // Land at the very top on entry.
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
      {/* Mobile — logo, copy, and image stacked, film-tape rails dropped in
          favor of just using FilmFooter's own mobile layout below */}
      <div className="md:hidden">
        <AboutStackedMobile />
      </div>

      {/* Desktop — poster layout with film-tape sprocket rails on the page
          edges (not the footer) */}
      <div className="hidden md:block">
        <AboutPosterDesktop />
      </div>

      <TicketMenu />
    </div>
  )
}

import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import ContactPosterDesktop from '../components/ContactPosterDesktop'
import ContactStackedMobile from '../components/ContactStackedMobile'
import { getLenis } from '../hooks/useLenis'

export default function ContactPage() {
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
      {/* Mobile — logo, copy, and typeform stacked, film-tape rails dropped
          in favor of just using FilmFooter's own mobile layout below */}
      <div className="md:hidden">
        <ContactStackedMobile />
      </div>

      {/* Desktop — poster layout with film-tape sprocket rails on the page
          edges (not the footer), same as the About page */}
      <div className="hidden md:block">
        <ContactPosterDesktop />
      </div>

      <TicketMenu />
    </div>
  )
}

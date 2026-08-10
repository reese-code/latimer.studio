import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import AboutPosterDesktop from '../components/AboutPosterDesktop'
import AboutStackedMobile from '../components/AboutStackedMobile'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function AboutPage() {
  useDocumentHead({
    title: 'About Latimer Studio — Denver Web Design & Branding Studio',
    description:
      'Latimer Studio is a Denver-based design studio with 50+ custom sites built across industries, blending UI/UX expertise, React development, and branding.',
    path: '/about',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'About Latimer Studio',
      url: 'https://latimer.studio/about',
    },
  })

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
      {/* Visually hidden — the page itself is the "Latimer Studio" logo
          mark plus body copy with no heading markup, so this gives
          crawlers/screen readers a real page title. */}
      <h1 className="sr-only">About Latimer Studio</h1>
      <h2 className="sr-only">
        A Denver, Colorado design studio with 50+ custom websites built across multiple industries.
      </h2>

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

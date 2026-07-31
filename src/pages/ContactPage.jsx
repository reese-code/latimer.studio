import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import FilmFooter, { CONTACT_LINKS } from '../components/FilmFooter'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
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
    <div className="flex min-h-screen w-full flex-col bg-ink">
      <div className="flex flex-1 flex-col items-center justify-center gap-10 px-5 py-24 text-center">
        <img
          src={latimerStudioLogo}
          alt="Latimer Studio"
          className="w-56 select-none brightness-0 invert md:w-96"
        />

        <div className="flex flex-row items-center gap-2">
          <span className="text-[8px] text-maroon">★</span>
          <span className="font-embodiment text-base tracking-[0.14em] text-cream/85 uppercase">
            Get In Touch
          </span>
          <span className="text-[8px] text-maroon">★</span>
        </div>

        <div className="flex flex-col items-center gap-3">
          {CONTACT_LINKS.map((link) =>
            link.href ? (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
                className="font-embodiment text-2xl tracking-[0.1em] text-cream no-underline uppercase transition-colors duration-200 hover:text-maroon md:text-3xl"
              >
                {link.label}
              </a>
            ) : (
              <span
                key={link.label}
                className="font-embodiment text-2xl tracking-[0.1em] text-cream/60 uppercase md:text-3xl"
              >
                {link.label}
              </span>
            )
          )}
        </div>
      </div>

      <TicketMenu />
      <FilmFooter variant="ink" />
    </div>
  )
}

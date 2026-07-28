import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import latimerStudioLogo from '../assets/Latimer-Studio.svg'
import aboutImage from '../assets/forge_poster.png'
import { getLenis } from '../hooks/useLenis'

gsap.registerPlugin(ScrollTrigger)

// Hero-only warp — sticky at the very top. As you scroll through the
// wrapper below it, the title widens outward and softens/blurs at the
// edges, like it's being stretched into a lens, then settles back down
// once you've scrolled past it. Nothing else on the page is touched.
const MAX_STRETCH = 1.9
const MAX_BLUR = 6

export default function AboutPage() {
  const heroWrapRef = useRef(null)
  const heroInnerRef = useRef(null)

  // Land at the very top — the warp only reads right starting from y=0.
  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [])

  useEffect(() => {
    if (!heroWrapRef.current || !heroInnerRef.current) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroInnerRef.current,
        { scaleX: 1, filter: 'blur(0px)' },
        {
          scaleX: MAX_STRETCH,
          filter: `blur(${MAX_BLUR}px)`,
          ease: 'none',
          scrollTrigger: {
            trigger: heroWrapRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  return (
    <div className="min-h-screen w-full bg-ink">
      {/* Hero — sticky at the absolute top, widens/warps as you scroll past it */}
      <div ref={heroWrapRef} className="relative h-[180vh] w-full">
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden px-5">
          <div
            ref={heroInnerRef}
            className="flex flex-col items-center gap-8 will-change-transform"
          >
            <img
              src={latimerStudioLogo}
              alt="Latimer Studio"
              className="w-64 select-none brightness-0 invert md:w-105"
            />
            <p className="max-w-4xl text-center font-sans text-[3rem] leading-[1.1] text-cream">
              We are a creative studio built on the belief that every brand
              deserves a story worth telling — part design house, part film
              set, all obsession with craft.
            </p>
          </div>
        </div>
      </div>

      {/* Image + text — inline on desktop, stacked with text below on mobile */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-5 py-20 md:flex-row md:items-center md:gap-16">
        <img
          src={aboutImage}
          alt="Studio work"
          className="w-full rounded-sm object-cover md:w-1/2"
        />
        <div className="flex flex-col gap-5 md:w-1/2">
          <h2 className="m-0 font-heading text-[1.5rem] font-light text-cream">
            How We Work
          </h2>
          <p className="m-0 text-[1rem] leading-[145%] text-cream/80">
            Every project starts with a question, not a template. We spend as
            much time understanding what makes a brand tick as we do
            designing for it — the strategy and the craft happen in the same
            room, at the same time.
          </p>
          <p className="m-0 text-[1rem] leading-[145%] text-cream/80">
            The result is work that feels considered rather than assembled:
            films, identities, and campaigns built to stand out precisely
            because they were never meant to look like anyone else's.
          </p>
        </div>
      </section>

      <TicketMenu />
      <FilmFooter />
    </div>
  )
}

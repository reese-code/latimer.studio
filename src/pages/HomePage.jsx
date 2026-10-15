import SiteNav from '../components/SiteNav'
import LetsTalkButton from '../components/LetsTalkButton'
import CursorImageTrail from '../components/CursorImageTrail'
import PopSlideCard from '../components/PopSlideCard'
import ProjectsSection from '../components/ProjectsSection'
import ServicesSection from '../components/ServicesSection'
import AboutSection from '../components/AboutSection'
import PricingSection from '../components/PricingSection'
import FaqSection from '../components/FaqSection'
import FilmFooter from '../components/FilmFooter'
import { useEffect, useMemo, useState } from 'react'
import { useSiteData } from '../hooks/useSiteData'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { homeQuery } from '../lib/queries'
import { optimizedImageUrl } from '../lib/sanityImage'

const DEFAULT_HERO_TEXT =
  'Creating e-commerce design in Denver, Colorado that actually converts through data-driven decisions.'

export default function HomePage() {
  const { siteSettings } = useSiteData()
  const [hero, setHero] = useState(null)
  const [pricing, setPricing] = useState(null)
  const [about, setAbout] = useState(null)
  const [faqs, setFaqs] = useState(null)
  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(homeQuery).then(
      (res) => !cancelled && (setHero(res?.hero || null), setPricing(res?.pricing || null), setAbout(res?.about || null), setFaqs(res?.faqs || null)),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])
  // Home doc wins; fall back to the legacy siteSettings images.
  const legacyImages = siteSettings?.heroTrailImages
  const rawHeroImages = hero?.images?.length ? hero.images : legacyImages
  // Uploads can be huge (e.g. 2400x3000 AVIF) — resize via Sanity's CDN so
  // cards don't render as bare colors while a giant file decodes.
  const heroImages = useMemo(
    () => rawHeroImages?.map((u) => optimizedImageUrl(u, { width: 900 })),
    [rawHeroImages]
  )
  useEffect(() => {
    heroImages?.forEach((u) => {
      const img = new Image()
      img.src = u
    })
  }, [heroImages])
  const heroText = hero?.text || DEFAULT_HERO_TEXT
  useDocumentHead({
    title: 'Latimer Studio — Denver Web Design & Branding Studio for Custom, High-Converting Websites',
    description:
      'Latimer Studio is a Denver-based design studio building custom, high-converting websites and brand identities — UI/UX design, React development, and branding for businesses that want to stand out.',
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Latimer Studio',
      url: 'https://latimer.studio/',
    },
  })

  return (
    <>
    <main className="relative flex h-dvh flex-col items-center overflow-hidden px-5 py-3 max-md:px-2 max-md:pt-16">
      <h1 className="sr-only">
        Websites with the structure of a Nolan plot, where every detail pays off later. Latimer Studio
      </h1>
      <h2 className="sr-only">
        Denver web design studio building custom websites, brand identities, and UI/UX design for businesses that want to stand out.
      </h2>

      <SiteNav />

      {/* Desktop (md+) — cursor-following image card, everything centered.
          Logos are sized off the viewport (vw) rather than a fixed max-width
          so they keep scaling up on larger screens, capped by max-h so they
          still shrink to fit on short viewports. */}
      <CursorImageTrail
        images={heroImages}
        className="hidden min-h-0 w-full max-w-[1400px] flex-1 flex-col items-center justify-center md:flex"
      >
        <img src="/Latimer.svg" alt="" className="w-[min(62vw,1100px)] max-h-[32vh] object-contain" />

        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="text-body max-w-md text-ink">
            {heroText}
          </p>
          <LetsTalkButton />
        </div>

        <img src="/Studio.svg" alt="" className="w-[min(48vw,860px)] max-h-[24vh] object-contain" />
      </CursorImageTrail>

      {/* Mobile — static (non-cursor-following) image card at the top filling
          the remaining space, then the headline and button at the bottom. */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-start gap-5 py-4 md:hidden">
        <PopSlideCard images={heroImages} className="min-h-0 w-full flex-1" />

        <div className="flex w-full flex-col items-start gap-3">
          <p className="w-full text-left font-sans text-[16px] font-medium leading-[115%] text-ink">
            {heroText}
          </p>
          <LetsTalkButton />
        </div>
      </div>

    </main>
    <ProjectsSection />
    <ServicesSection />
    <PricingSection pricing={pricing} />
    <AboutSection about={about} />
    <FaqSection faqs={faqs} />
    <FilmFooter />
    </>
  )
}

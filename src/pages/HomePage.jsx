import SiteNav from '../components/SiteNav'
import LetsTalkButton from '../components/LetsTalkButton'
import CursorImageTrail from '../components/CursorImageTrail'
import HeroSlideCard from '../components/HeroSlideCard'
import PopSlideCard from '../components/PopSlideCard'
import CursorModeToggle from '../components/CursorModeToggle'
import { useState } from 'react'
import { useSiteData } from '../hooks/useSiteData'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function HomePage() {
  const { siteSettings } = useSiteData()
  const [cursorMode, setCursorMode] = useState('movement')
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
    <main className="relative flex h-dvh flex-col items-center overflow-hidden px-5 py-3 max-md:pt-16">
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
        images={siteSettings?.heroTrailImages}
        mode={cursorMode}
        className="hidden min-h-0 w-full max-w-[1400px] flex-1 flex-col items-center justify-center md:flex"
      >
        <img src="/Latimer.svg" alt="" className="w-[min(62vw,1100px)] max-h-[32vh] object-contain" />

        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="text-body max-w-md text-ink">
            Creating e-commerce design in Denver, Colorado that actually converts through data-driven decisions.
          </p>
          <LetsTalkButton />
        </div>

        <img src="/Studio.svg" alt="" className="w-[min(48vw,860px)] max-h-[24vh] object-contain" />
      </CursorImageTrail>

      {/* Mobile — Latimer, Studio right under it, then a static
          (non-cursor-following) image card filling the remaining width and
          height, then left-aligned copy and button. */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-5 py-4 md:hidden">
        {/* Side by side: flex-grow matches each logo's aspect ratio (1099x354,
            861x346) so both come out the same height. */}
        <div className="flex w-full items-center gap-3">
          <img src="/Latimer.svg" alt="" className="h-auto min-w-0 basis-0" style={{ flexGrow: 1099 / 354 }} />
          <img src="/Studio.svg" alt="" className="h-auto min-w-0 basis-0" style={{ flexGrow: 861 / 346 }} />
        </div>

        {cursorMode === 'multi' ? (
          <PopSlideCard images={siteSettings?.heroTrailImages} className="mt-2 min-h-0 w-full flex-1" />
        ) : (
          <HeroSlideCard images={siteSettings?.heroTrailImages} className="mt-2 min-h-0 w-full flex-1" />
        )}

        <div className="flex w-full flex-col items-start gap-3 pr-14 text-left">
          <p className="text-body max-w-md text-ink">
            Creating e-commerce design in Denver, Colorado that actually converts through data-driven decisions.
          </p>
          <LetsTalkButton />
        </div>
      </div>

      <CursorModeToggle
        mode={cursorMode}
        onChange={setCursorMode}
        className="absolute bottom-3 right-4 md:left-4 md:right-auto"
      />
    </main>
  )
}

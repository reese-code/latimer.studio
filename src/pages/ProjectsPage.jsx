import { useEffect, useState } from 'react'
import SiteNav from '../components/SiteNav'
import ProjectsSection from '../components/ProjectsSection'
import PricingSection from '../components/PricingSection'
import FaqSection from '../components/FaqSection'
import FilmFooter from '../components/FilmFooter'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { homeQuery } from '../lib/queries'

export default function ProjectsPage() {
  const [home, setHome] = useState(null)

  useDocumentHead({
    title: 'Projects — Latimer Studio',
    description:
      'Selected custom websites and brand identities from Latimer Studio, a Denver-based design studio specializing in high-converting e-commerce.',
    path: '/projects',
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

  // Reuse the homepage's Sanity content for pricing and FAQs.
  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(homeQuery).then(
      (res) => !cancelled && setHome(res || null),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <main>
        <h1 className="m-0 w-full py-[80px] text-center font-sans text-[12vw] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink md:text-[128px]">
          Projects
        </h1>
        <ProjectsSection showHeading={false} />
      </main>

      <PricingSection pricing={home?.pricing} />
      <FaqSection faqs={home?.faqs} />
      <FilmFooter />
      <SiteNav />
    </>
  )
}

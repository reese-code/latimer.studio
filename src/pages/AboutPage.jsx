import { useEffect, useState } from 'react'
import SiteNav from '../components/SiteNav'
import AboutSection from '../components/AboutSection'
import FounderLetterSection from '../components/FounderLetterSection'
import FaqSection from '../components/FaqSection'
import FilmFooter from '../components/FilmFooter'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { homeQuery, aboutPageQuery } from '../lib/queries'

const ABOUT_PARAGRAPHS = [
  'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
  'We specialize in e-commerce, where every pixel has a job: guiding visitors to the product, building trust, and getting them to check out. Every decision is backed by data, not guesswork.',
  'From the first call to launch day, you work directly with the person designing and building your site. No account managers, no handoffs, no surprises.',
]

export default function AboutPage() {
  const [home, setHome] = useState(null)
  const [aboutDoc, setAboutDoc] = useState(null)

  useDocumentHead({
    title: aboutDoc?.metaTitle || 'About Latimer Studio — Denver Web Design & Branding Studio',
    description:
      aboutDoc?.metaDescription ||
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

  // The homepage's Sanity content supplies the FAQs and fallback carousel slides.
  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(homeQuery).then(
      (res) => !cancelled && setHome(res || null),
      () => {}
    )
    sanityClient.fetch(aboutPageQuery).then(
      (res) => !cancelled && setAboutDoc(res || null),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])

  const aboutContent = aboutDoc?.about
  const about = {
    ...home?.about,
    label: aboutContent?.label || home?.about?.label,
    paragraphs: aboutContent?.paragraphs?.length ? aboutContent.paragraphs : ABOUT_PARAGRAPHS,
    buttonLabel: aboutContent?.buttonLabel || 'Let’s talk',
    buttonHref: aboutContent?.buttonHref || '/contact',
    slides: aboutContent?.slides?.length ? aboutContent.slides : home?.about?.slides,
  }

  return (
    <>
      <main className="flex flex-col items-center px-2 pb-6 pt-20 md:px-5 md:pt-24">
        <h1 className="m-0 w-full max-w-250 self-center text-left font-sans text-[12vw] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink md:text-[128px]">
          {aboutDoc?.heading || 'Latimer Studio is a Denver based design studio specializing in e-com'}
        </h1>
      </main>

      <AboutSection about={about} />
      <FounderLetterSection letter={aboutDoc?.founderLetter} />
      <FaqSection faqs={home?.faqs} />
      <FilmFooter />
      <SiteNav />
    </>
  )
}

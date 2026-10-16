import { useEffect, useState } from 'react'
import SiteNav from '../components/SiteNav'
import TypeformEmbed from '../components/TypeformEmbed'
import FaqSection from '../components/FaqSection'
import FilmFooter from '../components/FilmFooter'
import { useSiteData } from '../hooks/useSiteData'
import { sanityClient } from '../lib/sanityClient'
import { homeQuery } from '../lib/queries'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'

const CONTACT_BG = '#EDEDF3'

export default function ContactPage() {
  const { siteSettings } = useSiteData()
  const [faqs, setFaqs] = useState(null)
  useDocumentHead({
    title: 'Contact Latimer Studio — Start Your Denver Web Design Project',
    description:
      'Get in touch with Latimer Studio to start a custom website, brand identity, or UI/UX project with our Denver-based design team.',
    path: '/contact',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Latimer Studio',
      url: 'https://latimer.studio/contact',
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

  // Reuse the homepage's Sanity FAQs.
  useEffect(() => {
    let cancelled = false
    sanityClient.fetch(homeQuery).then(
      (res) => !cancelled && setFaqs(res?.faqs || null),
      () => {}
    )
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen w-full" style={{ background: CONTACT_BG }}>
      <main className="flex flex-col items-center px-2 md:px-5">
        <h1 className="m-0 w-full py-[80px] text-center font-sans text-[12vw] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink md:text-[128px]">
          Contact
        </h1>

        <div className="w-full" style={{ minHeight: 700 }}>
          <TypeformEmbed id={siteSettings?.typeformId} className="h-full w-full" style={{ minHeight: 700 }} />
        </div>
      </main>

      <FaqSection faqs={faqs} />
      <FilmFooter />
      <SiteNav background={CONTACT_BG} />
    </div>
  )
}

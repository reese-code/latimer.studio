import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import { getLenis } from '../hooks/useLenis'
import { useSanityData } from '../hooks/useSanityData'
import { privacyPolicyQuery } from '../lib/queries'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function PrivacyPolicyPage() {
  const { data: policy } = useSanityData(privacyPolicyQuery)
  const title = policy?.title || 'Privacy Policy'
  const sections = policy?.sections || []

  useDocumentHead({
    title: `${title} — Latimer Studio`,
    description: 'How Latimer Studio collects, uses, and protects your information.',
    path: '/privacy-policy',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      url: 'https://latimer.studio/privacy-policy',
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
    <div className="flex min-h-screen w-full flex-col bg-case-bg">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-5 py-24 md:px-0">
        <h1 className="m-0 font-embodiment text-[3rem] font-light uppercase tracking-[-1px] text-[#4a4238] md:text-[4rem]">
          {title}
        </h1>
        <h2 className="sr-only">
          Latimer Studio's privacy policy — how we collect, use, and protect your information.
        </h2>

        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-2">
              <span className="text-[8px] text-maroon">★</span>
              <h2 className="m-0 font-embodiment text-base font-normal tracking-[0.14em] text-[#4a4238] uppercase">
                {section.title}
              </h2>
            </div>
            <p className="m-0 font-embodiment text-base leading-[150%] tracking-[0.06em] text-[#4a4238] uppercase">
              {section.body}
            </p>
          </div>
        ))}
      </div>

      <TicketMenu />
      <FilmFooter />
    </div>
  )
}

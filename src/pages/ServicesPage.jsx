import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SiteNav from '../components/SiteNav'
import AboutSection from '../components/AboutSection'
import PricingSection from '../components/PricingSection'
import ProjectsSection from '../components/ProjectsSection'
import FaqSection from '../components/FaqSection'
import FilmFooter from '../components/FilmFooter'
import { getLenis } from '../hooks/useLenis'
import { useDocumentHead } from '../hooks/useDocumentHead'
import { sanityClient } from '../lib/sanityClient'
import { homeQuery } from '../lib/queries'
import { useServices } from '../hooks/useServices'

const DEFAULT_PARAGRAPHS = [
  'We design and build custom websites and brand identities for businesses that want to stand out. Every project is built around one goal: turning visitors into customers.',
  'You get UI/UX design, React development, and an easy-to-edit CRM, all from the person designing and building your site. No account managers, no handoffs, no surprises.',
]

export default function ServicesPage() {
  const { slug } = useParams()
  const service = useServices().find((s) => s.slug === slug)
  const [home, setHome] = useState(null)

  useDocumentHead({
    title: `${service?.label || 'Services'} — Latimer Studio Denver Web Design & Branding`,
    description:
      'Custom web design, React development, and branding from Latimer Studio in Denver. See our services, pricing, and past projects.',
    path: service ? `/services/${service.slug}` : '/services',
  })

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
  }, [slug])

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

  const about = {
    ...home?.about,
    label: service?.about?.label || 'About the Service',
    paragraphs: service?.about?.paragraphs?.length
      ? service.about.paragraphs
      : service?.paragraphs || DEFAULT_PARAGRAPHS,
    buttonLabel: service?.about?.buttonLabel || 'Let’s talk',
    buttonHref: service?.about?.buttonHref || '/contact',
    slides: service?.about?.slides,
  }

  return (
    <>
      <main className="flex flex-col items-center px-2 pb-20 pt-20 md:px-5">
        <h1 className="m-0 w-full text-center font-sans text-[12vw] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink md:text-[128px]">
          {service?.label || 'Services'}
        </h1>
      </main>

      <AboutSection about={about} />
      <PricingSection pricing={home?.pricing} />
      <ProjectsSection />
      <FaqSection faqs={home?.faqs} />
      <FilmFooter />
      <SiteNav />
    </>
  )
}

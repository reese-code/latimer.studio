import { useEffect } from 'react'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import { getLenis } from '../hooks/useLenis'

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: "We collect information you provide directly to us, such as when you reach out through our contact channels, along with basic technical data (like browser type and device info) gathered automatically as you browse this site.",
  },
  {
    title: 'How We Use Information',
    body: 'Information collected is used to respond to inquiries, improve the site experience, and communicate about our work. We do not sell your personal information to third parties.',
  },
  {
    title: 'Cookies & Analytics',
    body: 'This site may use cookies and similar technologies to understand how visitors use it. You can control cookies through your browser settings at any time.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about this policy, reach out at info@latimer.studio.',
  },
]

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>

        {SECTIONS.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <div className="flex flex-row items-center gap-2">
              <span className="text-[8px] text-maroon">★</span>
              <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238] uppercase">
                {section.title}
              </span>
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

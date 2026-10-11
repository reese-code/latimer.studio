import SiteNav from '../components/SiteNav'
import LetsTalkButton from '../components/LetsTalkButton'
import { useDocumentHead } from '../hooks/useDocumentHead'

export default function HomePage() {
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
    <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-3">
      <h1 className="sr-only">
        Websites with the structure of a Nolan plot, where every detail pays off later. Latimer Studio
      </h1>
      <h2 className="sr-only">
        Denver web design studio building custom websites, brand identities, and UI/UX design for businesses that want to stand out.
      </h2>

      <SiteNav />

      <div className="flex w-full max-w-[935px] flex-col items-center">
        <img
          src="/Latimer.svg"
          alt=""
          className="w-full"
        />

        <div className="flex flex-col items-center gap-6 py-6 text-center">
          <p className="text-body max-w-md text-ink">
            Creating e-commerce design in Denver, Colorado that actually converts through data-driven decisions.
          </p>
          <LetsTalkButton />
        </div>

        <img
          src="/Studio.svg"
          alt=""
          className="w-full max-w-[731px]"
        />
      </div>
    </main>
  )
}

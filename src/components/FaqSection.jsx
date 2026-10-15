import { useState } from 'react'
import LetsTalkButton from './LetsTalkButton'

const FILLER = {
  label: 'FAQs',
  title: 'Latimer Studio is here to answer all of your questions about how different designs can improve your conversion rates.',
  buttonLabel: 'View all articles',
  buttonHref: '/info',
  items: Array.from({ length: 4 }, (_, i) => ({
    _key: `filler-${i}`,
    question: 'Why does my site not convert?',
    overview:
      'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
  })),
}

// One shared glyph: the vertical bar rotates away while the whole icon
// turns 45° so the plus becomes an X (and back).
function Icon({ open }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 text-ink transition-transform duration-300 ease-out motion-reduce:transition-none ${
        open ? 'rotate-45' : 'rotate-0'
      }`}
    >
      <path d="M1 9H17M9 1V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Faq({ faq }) {
  const [open, setOpen] = useState(false)
  const id = `faq-${faq._key}`
  return (
    <div className="rounded-2xl border-2 border-[#CFCFCF] bg-white/50">
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-4 text-left text-ink"
      >
        <h3 className="text-h3 m-0">{faq.question}</h3>
        <Icon open={open} />
      </button>

      {/* grid-rows 0fr -> 1fr animates to the content's natural height. */}
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div
            className={`flex flex-col items-start gap-5 px-4 pb-4 transition-all duration-300 ease-out motion-reduce:transition-none ${
              open ? 'translate-y-0 opacity-100 delay-100' : '-translate-y-2 opacity-0'
            }`}
            inert={!open}
          >
            {faq.overview && <p className="text-body m-0 max-w-xl text-ink">{faq.overview}</p>}
            <LetsTalkButton
              label={faq.buttonLabel || 'Learn more'}
              to={faq.slug ? `/info/${faq.slug}` : '/info'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FaqSection({ faqs: sanityFaqs }) {
  const faqs = sanityFaqs?.items?.length ? sanityFaqs : FILLER
  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      <div className="flex items-center gap-3 text-ink/60 md:gap-5">
        <span className="h-0.5 w-8 bg-current md:w-15" />
        <h2 className="text-body m-0 uppercase">{faqs.label || 'FAQs'}</h2>
        <span className="h-0.5 flex-1 bg-current" />
      </div>

      <div className="mx-auto mt-10 max-w-[1000px] md:mt-16">
        {faqs.title && <h3 className="text-h3 m-0 mb-4 text-ink">{faqs.title}</h3>}
        <LetsTalkButton label={faqs.buttonLabel || 'View all articles'} to={faqs.buttonHref || '/info'} />

        <div className="mt-8 flex flex-col gap-2 md:mt-12">
          {faqs.items.map((faq) => (
            <Faq key={faq._key} faq={faq} />
          ))}
        </div>
      </div>
    </section>
  )
}

import LetsTalkButton from './LetsTalkButton'

const DEFAULT_PARAGRAPHS = [
  'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
  'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
]

export default function FounderLetterSection({ letter }) {
  const paragraphs = letter?.paragraphs?.length ? letter.paragraphs : DEFAULT_PARAGRAPHS

  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      <div className="flex items-center gap-3 text-ink/60 md:gap-5">
        <span className="h-0.5 w-8 bg-current md:w-15" />
        <h2 className="text-body m-0 uppercase">{letter?.label || 'Founder Letter'}</h2>
        <span className="h-0.5 flex-1 bg-current" />
      </div>

      <div className="mt-10 flex flex-col gap-5 md:mt-16 md:flex-row">
        <div className="aspect-[7/5] w-full overflow-hidden rounded-2xl bg-[#1a1a1a] md:w-1/2 md:flex-none">
          {letter?.image && (
            <img src={letter.image} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start justify-between gap-8">
          <div>
            <h3 className="text-h3 m-0 mb-4 text-ink">{letter?.title || 'Letter from Reese Latimer'}</h3>
            <div className="flex max-w-xl flex-col gap-5">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-body m-0 text-ink">
                  {p}
                </p>
              ))}
            </div>
          </div>
          <LetsTalkButton label={letter?.buttonLabel || 'Learn more'} to={letter?.buttonHref || '/info'} />
        </div>
      </div>
    </section>
  )
}

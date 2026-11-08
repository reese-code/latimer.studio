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

      <div className="mt-10 flex flex-col items-center gap-8 text-center md:mt-16">
        <div className="flex max-w-3xl flex-col gap-5">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-h3 m-0 text-ink">
              {p}
            </p>
          ))}
        </div>
        <LetsTalkButton label={letter?.buttonLabel || 'Learn more'} to={letter?.buttonHref || '/info'} />

        {letter?.image && (
          <div className="aspect-[7/5] w-full max-w-4xl overflow-hidden rounded-2xl">
            <img src={letter.image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </section>
  )
}

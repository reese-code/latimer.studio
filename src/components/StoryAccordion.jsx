import { useRef, forwardRef } from 'react'
import { getLenis } from '../hooks/useLenis'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'

// ---------------------------------------------------------------------------
// StoryAccordion — the numbered, stacking-sticky-title accordion used on
// case-study pages (see ProjectPage.jsx's ScrollStorySection), reused here
// for Info articles with two additions:
//   - `ratio` ('default' | 'half') controls the text/image column split —
//     the usual 1/3-text–2/3-image, or an even 50/50.
//   - Each combo's image is wrapped in its own `position: sticky` box (20px
//     desktop / 12px mobile top offset) scoped to that combo's own row, so
//     when a paragraph runs longer than its image, the image pins to the
//     top of the viewport until the paragraph finishes scrolling past, then
//     continues scrolling normally with the rest of the row. Short
//     paragraphs (row no taller than the image) never trigger any stick at
//     all — this falls out of plain CSS sticky, no measurement needed.
//
// Recursive nesting (see StackingSections below) is what makes the
// stacking-sticky title effect work: each title's containing block must
// span from its own position to the end of the group so it stays pinned
// while later titles lock in below it — nesting section[i+1..] inside
// section[i]'s wrapper gives every title exactly that range for free.
// ---------------------------------------------------------------------------

const STICKY_TOP = 0
const TITLE_STACK_GAP = 40

const ComboMedia = forwardRef(function ComboMedia({ combo, className, alt = '' }, ref) {
  if (combo.video) {
    return (
      <video
        ref={ref}
        src={combo.video}
        poster={combo.image || undefined}
        preload="metadata"
        className={className}
        autoPlay
        muted
        loop
        playsInline
      />
    )
  }
  return (
    <img
      ref={ref}
      src={optimizedImageUrl(combo.image, { width: 1000 })}
      srcSet={srcSetFor(combo.image, [480, 768, 1000, 1500])}
      sizes="(min-width: 768px) 33vw, 100vw"
      alt={alt}
      draggable={false}
      loading="lazy"
      decoding="async"
      className={className}
    />
  )
})

export default function StoryAccordion({ sections, ratio = 'default' }) {
  const containerRef = useRef(null)
  const titleRefs = useRef([])
  const sectionRefs = useRef([])

  function scrollToSection(index) {
    const target = sectionRefs.current[index]
    if (!target) return
    const lenis = getLenis()
    const offset = -(STICKY_TOP + index * TITLE_STACK_GAP)
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.1 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!sections?.length) return null

  const gridCols = ratio === 'half' ? 'md:grid-cols-2' : 'md:grid-cols-[1fr_2fr]'

  return (
    <div ref={containerRef} className="w-full">
      <StackingSections
        sections={sections}
        index={0}
        titleRefs={titleRefs}
        sectionRefs={sectionRefs}
        onSelect={scrollToSection}
        gridCols={gridCols}
      />
    </div>
  )
}

function StackingSections({ sections, index, titleRefs, sectionRefs, onSelect, gridCols }) {
  if (index >= sections.length) return null
  const section = sections[index]
  const combos = section.combos || []

  return (
    <div ref={(el) => (sectionRefs.current[index] = el)} className="relative">
      <button
        type="button"
        ref={(el) => (titleRefs.current[index] = el)}
        onClick={() => onSelect(index)}
        style={{ top: STICKY_TOP + index * TITLE_STACK_GAP, height: TITLE_STACK_GAP }}
        className="sticky z-10 flex w-full cursor-pointer items-center border-t border-ink/25 bg-cream px-0 text-left font-sans"
      >
        {section.number && (
          <span className="w-9 shrink-0 text-xs tracking-[0.14em] text-ink uppercase md:text-base">
            {section.number}
          </span>
        )}
        {section.title && (
          <h3 className="m-0 text-xs font-normal tracking-[0.14em] text-ink uppercase md:text-base">
            {section.title}
          </h3>
        )}
      </button>

      {combos.map((combo, j) => (
        <div key={j} className={`grid gap-x-10 gap-y-6 pt-8 pb-16 ${gridCols}`}>
          <p className="m-0 max-w-[85%] text-justify font-sans text-base leading-[150%] tracking-[0.06em] text-ink uppercase">
            {combo.paragraph}
          </p>

          {/* Sticky-pinned image — 20px desktop / 12px mobile top offset.
              Pins only while its own row (as tall as the paragraph, when
              the paragraph runs longer) still has room above it to scroll
              through; otherwise it simply scrolls with the row like normal
              content. */}
          <div className="top-3 h-fit md:sticky md:top-5">
            <ComboMedia
              combo={combo}
              alt={section.title}
              className="aspect-square w-full select-none rounded-3xl object-cover"
            />
          </div>
        </div>
      ))}

      <StackingSections
        sections={sections}
        index={index + 1}
        titleRefs={titleRefs}
        sectionRefs={sectionRefs}
        onSelect={onSelect}
        gridCols={gridCols}
      />
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import LetsTalkButton from './LetsTalkButton'
import { getLenis } from '../hooks/useLenis'

// 500×700 scaled down 20% on desktop, 40% on mobile.
const SIZES = { desktop: { w: 400, h: 560 }, mobile: { w: 300, h: 420 } }
const GAP = 20
const SPEED = 40 // px per second
const COPIES = 3

const DEFAULT_PARAGRAPHS = [
  'Latimer Studio is a Denver-based studio focusing on crafting visual experiences that amaze and convert. With 50+ custom sites built across multiple industries, we blend UI and UX expertise with React branding and an easy-to-edit CRM for even the least tech-savvy people.',
]

// The track holds 3 copies of the slides. Auto-scroll advances one copy's
// width (33.33% of the track) and then snaps back to the start with no
// transition, which is invisible because the copies are identical. Dragging
// uses the same wrap, so swiping backwards from the start lands on the last slide.
function Carousel({ slides }) {
  const trackRef = useRef(null)
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const on = () => setMobile(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const { w, h } = mobile ? SIZES.mobile : SIZES.desktop
  const n = slides.length
  const period = n * (w + GAP)

  useEffect(() => {
    const track = trackRef.current
    const viewport = track.parentElement
    let offset = 0
    let dragging = false
    let startX = 0
    let startOffset = 0
    let last = performance.now()
    let raf
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const apply = () => {
      offset = ((offset % period) + period) % period
      // Sit on the middle copy so there is always content on both sides.
      track.style.transform = `translate3d(${-(period + offset)}px,0,0)`
    }
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      if (!dragging && !reduce) {
        offset += SPEED * dt
        apply()
      }
      raf = requestAnimationFrame(tick)
    }
    const down = (e) => {
      dragging = true
      startX = e.clientX
      startOffset = offset
      viewport.setPointerCapture(e.pointerId)
    }
    const move = (e) => {
      if (!dragging) return
      offset = startOffset - (e.clientX - startX)
      apply()
    }
    const up = () => {
      dragging = false
    }
    const wheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      offset += e.deltaX
      apply()
    }
    apply()
    raf = requestAnimationFrame(tick)
    viewport.addEventListener('pointerdown', down)
    viewport.addEventListener('pointermove', move)
    viewport.addEventListener('pointerup', up)
    viewport.addEventListener('pointercancel', up)
    viewport.addEventListener('wheel', wheel, { passive: false })
    return () => {
      cancelAnimationFrame(raf)
      viewport.removeEventListener('pointerdown', down)
      viewport.removeEventListener('pointermove', move)
      viewport.removeEventListener('pointerup', up)
      viewport.removeEventListener('pointercancel', up)
      viewport.removeEventListener('wheel', wheel)
    }
  }, [period])

  return (
    <div className="-mx-2 mt-10 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing md:-mx-4 md:mt-14">
      <div ref={trackRef} className="flex will-change-transform" style={{ gap: GAP }}>
        {Array.from({ length: COPIES }).flatMap((_, c) =>
          slides.map((s, i) => (
            <div
              key={`${c}-${i}`}
              aria-hidden={c !== 1 || undefined}
              className="shrink-0 overflow-hidden rounded-xl"
              style={{ width: w, height: h }}
            >
              <img src={s.image} alt="" draggable={false} className="h-full w-full object-cover" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Portable Text (paragraph + bold/italic + link marks) -> one <p> per block.
const P = `text-body m-0 mb-4 text-left text-ink`

function Spans({ block }) {
  const defs = block.markDefs || []
  return (block.children || []).map((span, i) => {
    let node = span.text
    for (const m of span.marks || []) {
      const def = defs.find((d) => d._key === m)
      if (def?._type === 'link' && def.href) {
        const external = /^https?:/.test(def.href)
        node = (
          <a
            href={def.href}
            {...(def.newTab || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="underline underline-offset-4 transition-opacity hover:opacity-60"
          >
            {node}
          </a>
        )
      } else if (m === 'strong') node = <strong className="font-bold">{node}</strong>
      else if (m === 'em') node = <em>{node}</em>
    }
    return <span key={`${block._key}-${i}`}>{node}</span>
  })
}

function Paragraphs({ value, lead, plain }) {
  return value?.map((block, i) =>
    plain ? (
      <h3 key={block._key || i} className={`text-h3 m-0 mb-4 text-left text-[24px] text-ink ${TEXT_W}`}>
        <Spans block={block} />
      </h3>
    ) : (
    <p key={block._key || i} className={`${P} ${TEXT_W}`}>
      {i === 0 && lead && (
        <>
          <strong className="font-bold">{lead}</strong>{' '}
        </>
      )}
      <Spans block={block} />
    </p>
    )
  )
}

const TEXT_W = 'mx-auto max-w-[1000px]'

// Adjacent block margins collapse (plain block layout), so the gap before a
// title is exactly 60px and the gap after it exactly 40px on desktop.
function Title({ children }) {
  return <h3 className={`text-h3 m-0 mb-6 mt-[60px] text-left text-[24px] text-ink first:mt-0 md:mb-10 ${TEXT_W}`}>{children}</h3>
}

// Accordion titles pin under the navbar and stay pinned until the end of
// their group because the following sections are nested inside its wrapper.
// Collapsed, every title pins at the same spot so only the current one shows
// (later titles paint over earlier ones); hovering a pinned title pops the
// whole stack down, each title 40px below the previous one.
const TITLE_STACK_GAP = 40
const NAV_OFFSET = 'var(--navbar-height, 56px)'

function StickyTitle({ index, first, expanded, onEnter, onLeave, onClick, children }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        // Only a title that is actually pinned (not one still in the flow) opens the stack.
        const pinnedTop = parseFloat(getComputedStyle(e.currentTarget).top)
        if (expanded || e.currentTarget.getBoundingClientRect().top <= pinnedTop + 1) onEnter()
      }}
      onMouseLeave={onLeave}
      style={{
        top: `calc(${NAV_OFFSET} + ${expanded ? index * TITLE_STACK_GAP : 0}px)`,
        height: TITLE_STACK_GAP,
        background: "var(--color-bg) url('/concrete-texture.png') repeat fixed center top",
      }}
      className={`sticky z-10 mb-6 flex items-center border-t-2 transition-[top,color,border-color] duration-200 border-ink/60 cursor-pointer text-left font-sans text-ink/60 hover:border-ink hover:text-ink md:mb-10 ${TEXT_W} ${
        first ? '' : 'mt-[60px]'
      }`}
    >
      <h3 className="m-0 text-[12px] font-normal uppercase tracking-[0.14em] md:text-[16px]">{children}</h3>
    </div>
  )
}

function Stack({ sections, index = 0, first, expanded, onEnter, onLeave }) {
  const s = sections[index]
  const ref = useRef(null)
  if (!s) return null
  // Scroll so the section's top lands where its title sits in the open stack.
  const scrollToSection = () => {
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 56
    const offset = -(navH + index * TITLE_STACK_GAP)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(ref.current, { offset, duration: 1.1 })
    else window.scrollTo({ top: ref.current.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
  }
  return (
    <div ref={ref} className="relative">
      <StickyTitle index={index} first={first && index === 0} expanded={expanded} onEnter={onEnter} onLeave={onLeave} onClick={scrollToSection}>
        {s.title}
      </StickyTitle>
      {s.body.map((c) => (
        <Block key={c._key} b={c} />
      ))}
      <Stack sections={sections} index={index + 1} expanded={expanded} onEnter={onEnter} onLeave={onLeave} />
    </div>
  )
}

// A title block's optional button renders as one more block after its content.
const withButton = (b) => [
  ...(b.body || []),
  ...(b.buttonLabel && b.buttonHref ? [{ _type: 'button', _key: `${b._key}-button`, label: b.buttonLabel, href: b.buttonHref }] : []),
]

const isAccordion = (b) => (b._type === 'heading' || b._type === 'titledSection') && b.style !== 'h3'

// Accordion titles start a section; everything until the next one is its body.
function Content({ blocks }) {
  const [expanded, setExpanded] = useState(false)
  const closeTimer = useRef(null)
  const onEnter = () => {
    clearTimeout(closeTimer.current)
    setExpanded(true)
  }
  // Short delay so moving between titles as they slide doesn't flicker the stack shut.
  const onLeave = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setExpanded(false), 120)
  }
  const lead = []
  const sections = []
  for (const b of blocks) {
    if (isAccordion(b)) sections.push({ title: b._type === 'heading' ? b.text : b.title, body: withButton(b) })
    else (sections.length ? sections[sections.length - 1].body : lead).push(b)
  }
  return (
    <>
      {lead.map((c, i) => (
        // Only paragraphs ahead of any title are the 24px h3 intro; ones after a title are its body copy.
        <Block key={c._key} b={c} plain={!lead.slice(0, i).some((p) => p._type === 'heading' || p._type === 'titledSection')} />
      ))}
      <Stack sections={sections} first={!lead.length} expanded={expanded} onEnter={onEnter} onLeave={onLeave} />
    </>
  )
}

// Renders service `content` blocks (see schemaTypes/service.js).
function Block({ b, plain }) {
  switch (b._type) {
    case 'heading':
      return <Title>{b.text}</Title>
    case 'paragraph':
      return <Paragraphs value={b.text} plain={plain} />
    case 'titledParagraph':
      return <Paragraphs value={b.text} lead={b.title} />
    case 'list': {
      const Tag = b.listType === 'numbered' ? 'ol' : 'ul'
      return (
        <Tag className={`text-body m-0 mb-4 pl-[1.3em] text-left text-ink ${TEXT_W} ${b.listType === 'numbered' ? 'list-decimal' : 'list-disc'}`}>
          {b.items?.map((t, i) => (
            <li key={i} className={i ? 'mt-2' : undefined}>
              {t}
            </li>
          ))}
        </Tag>
      )
    }
    case 'titledSection':
      return (
        <div className="mt-[60px] first:mt-0">
          <Title>{b.title}</Title>
          {withButton(b).map((c) => (
            <Block key={c._key} b={c} />
          ))}
        </div>
      )
    case 'button':
      return (
        <div className={`mb-4 ${TEXT_W}`}>
          <LetsTalkButton label={b.label} to={b.href} />
        </div>
      )
    default:
      return null
  }
}

export default function AboutSection({ about }) {
  const paragraphs = about?.paragraphs?.length ? about.paragraphs : DEFAULT_PARAGRAPHS
  // Slides without an image are dropped — no color-block placeholders.
  const slides = (about?.slides || []).filter((s) => s?.image)
  const hasContent = about?.content?.length > 0

  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      {!about?.hideLabel && (
        <div className="flex items-center gap-3 text-ink/60 md:gap-5">
          <span className="h-0.5 w-8 bg-current md:w-15" />
          <h2 className="text-body m-0 uppercase">{about?.label || 'About the Studio'}</h2>
          <span className="h-0.5 flex-1 bg-current" />
        </div>
      )}

      <div className={`${hasContent ? '' : `${TEXT_W} `}${about?.hideLabel ? '' : 'mt-10 md:mt-16'}`}>
        {hasContent
          ? <Content blocks={about.content} />
          : paragraphs.map((p, i) => (
              <h3 key={i} className="text-h3 m-0 mb-4 text-ink">
                {p}
              </h3>
            ))}
        <div className={TEXT_W}>
          <LetsTalkButton label={about?.buttonLabel || 'Learn more'} to={about?.buttonHref || '/info'} />
        </div>
      </div>

      {slides.length > 0 && <Carousel slides={slides} />}
    </section>
  )
}

import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { PROJECTS as PROJECT_LIST } from '../data/projects'
import TicketMenu from '../components/TicketMenu'
import studioRoLogo from '../assets/Studio-ro.svg'

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin)

const TITLE_LOGOS = {
  studioro: studioRoLogo,
}

const PROJECTS = Object.fromEntries(PROJECT_LIST.map((p) => [p.id, p]))

export default function ProjectPage() {
  const { id }      = useParams()
  const navigate     = useNavigate()
  const project       = PROJECTS[id]

  // Entrance — the case study simply fades onto screen on mount, no
  // transition overlay.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!project) return
    setVisible(false)
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [id, project])

  const handleBack = () => navigate('/')

  // Nav ticket only appears while scrolling up on the case study — hidden
  // by default, and again while scrolling down. Scrolling (including all
  // the way up) never navigates away — leaving is click-only.
  const [showTicket, setShowTicket] = useState(false)
  useEffect(() => {
    let lastY = window.scrollY
    function onScroll() {
      const y     = window.scrollY
      const delta = y - lastY
      if (Math.abs(delta) < 4) return
      setShowTicket(delta < 0 && y > 40)
      lastY = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!project) {
    navigate('/')
    return null
  }

  return (
    <PageShell visible={visible}>
      <ProjectContent project={project} onBack={handleBack} />
      <TicketMenu forceHidden={!showTicket} />
    </PageShell>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageShell({ children, visible }) {
  return (
    <div
      className={`relative min-h-screen bg-case-bg transition-opacity duration-[0.6s] ease ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}

function ProjectContent({ project, onBack }) {
  return (
    <div className="relative z-5 bg-case-bg">
      <CaseStudyHero project={project} />

      <div className="px-3 pt-16 md:px-5">
        {project.storySections ? (
          <ScrollStorySection sections={project.storySections} />
        ) : (
          <ProjectDescription project={project} />
        )}
        <div className="m-0 border-t border-[rgba(114,47,55,0.15)]" />
        <ProjectFooter onBack={onBack} />
      </div>
    </div>
  )
}

// Full-bleed case-study hero — logotype-style title + tagline over the
// project image, with a meta strip (project #/industry/category/date +
// "See Site") pinned to the bottom. Matches the Studio Ro reference frame;
// falls back to the plain poster art for projects without a dedicated
// hero shot. NOW SHOWING / tags moved into ProjectTags below the hero.
function CaseStudyHero({ project }) {
  return (
    <div className="relative h-[100vh] min-h-[520px] w-full overflow-hidden bg-ink">
      <img
        src={project.poster}
        alt={project.label}
        draggable={false}
        className="absolute inset-0 h-full w-full select-none object-cover object-[center_25%]"
      />

      {/* Top + bottom gradients for text legibility over the image */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0)_60%,rgba(0,0,0,0.75)_100%)]" />

      {/* Title + tagline */}
      <div className="absolute top-8 left-3 right-3 md:left-5 md:right-5">
        {TITLE_LOGOS[project.id] ? (
          <img
            src={TITLE_LOGOS[project.id]}
            alt={project.label}
            className="mb-2 h-auto w-full max-w-144.5"
          />
        ) : (
          <h1 className="mb-2 font-3don text-[200px] leading-[0.9] font-light tracking-[-1px] text-cream">
            {project.label.replace(' ', '-')}
          </h1>
        )}
        {project.tagline && (
          <p className="m-0 font-embodiment text-base leading-[145%] uppercase tracking-[0.06em] text-cream">
            {project.tagline}
          </p>
        )}
      </div>

      {/* Bottom meta strip */}
      <div className="absolute left-3 right-3 bottom-6 flex items-center justify-between gap-6 md:left-5 md:right-5">
        <div className="flex flex-row items-center gap-8">
          <MetaField label="PROJECT" value={project.number} />
          {project.industry && <MetaField label="INDUSTRY" value={project.industry} />}
          {project.category && <MetaField label="CATEGORY" value={project.category} />}
          <MetaField label="DATE" value={project.date || project.year} />
        </div>

        {project.siteUrl && (
          <a
            href={project.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-scoop inline-block whitespace-nowrap  border-cream px-[22px] py-2.5 font-embodiment text-base tracking-[0.14em] text-cream no-underline hover:bg-white hover:text-ink"
          >
            SEE SITE
          </a>
        )}
      </div>
    </div>
  )
}

function MetaField({ label, value }) {
  return (
    <div className="flex flex-row gap-2">
      <span className="font-embodiment text-base tracking-[0.14em] text-cream">
        {label}
      </span>
      <span className="font-embodiment text-[24px] leading-[145%] tracking-[0.18px] text-cream">
        {value}
      </span>
    </div>
  )
}

// ─── Scroll-motion case-study story section ────────────────────────────────
//
// Left column: a stack of numbered titles that pin to the top of the
// viewport as you scroll and remain visible — each new title locks in just
// below the last, so by the time you reach the final section all of them
// are stacked on screen together. Clicking a title smoothly scrolls back
// to its pinned position. Right column: the accompanying imagery, which
// scrolls the ordinary way. Once you scroll past the whole group the
// titles release together and continue scrolling away like normal content.
// A small opaque cap sits above the first title so nothing scrolling
// underneath is ever visible above the stack.
const TOP_CAP           = 20  // px — breathing room above the stack, opaque
const STICKY_TOP        = TOP_CAP
const TITLE_STACK_GAP   = 40  // px added per stacked title

function ScrollStorySection({ sections }) {
  const containerRef = useRef(null)
  const titleRefs    = useRef([])
  const sectionRefs   = useRef([])
  const paraRefs      = useRef([])
  const imageRefs     = useRef([])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      paraRefs.current.forEach((el) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          }
        )
      })

      imageRefs.current.forEach((el) => {
        if (!el) return
        gsap.fromTo(
          el,
          { opacity: 0, y: 48, scale: 1.03 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          }
        )
      })
    }, containerRef)

    return () => ctx.revert()
  }, [sections])

  function scrollToSection(index) {
    // Scroll target is the section's own (non-sticky) wrapper, not the
    // sticky title button — once a title is pinned, its bounding rect
    // always reports the pinned position, which would make ScrollToPlugin
    // compute a no-op scroll for any title you've already scrolled past.
    // The wrapper's rect always reflects the real document position.
    const target = sectionRefs.current[index]
    if (!target) return
    gsap.to(window, {
      duration: 1.1,
      ease: 'power2.inOut',
      scrollTo: { y: target, offsetY: STICKY_TOP + index * TITLE_STACK_GAP },
    })
  }

  return (
    <div ref={containerRef} className="grid gap-x-10 md:grid-cols-[1fr_2fr]">
      {/* Pinned, stacking-title scroll story — the titles pin and stack the
          same way on every breakpoint. On mobile each title carries its own
          image inline (no separate scrolling column); on desktop the image
          lives in the column on the right and scrolls independently. */}
      <div>
        {/* Opaque cap — pins above the title stack for the same duration
            as the stack itself, so no scrolling text ever peeks through
            the gap above it. */}
        <div className="sticky top-0 z-20 bg-case-bg" style={{ height: TOP_CAP }} />
        <StackingTitles
          sections={sections}
          index={0}
          titleRefs={titleRefs}
          sectionRefs={sectionRefs}
          paraRefs={paraRefs}
          onSelect={scrollToSection}
        />
      </div>

      <div className="hidden flex-col gap-6 pb-16 md:flex">
        {sections.map((section, i) => (
          <img
            key={section.number}
            ref={(el) => (imageRefs.current[i] = el)}
            src={section.image}
            alt={section.title}
            draggable={false}
            className="h-[70vh] w-full select-none rounded-3xl object-cover"
          />
        ))}
      </div>
    </div>
  )
}

// Recursive nesting is what makes the stacking-sticky effect work: each
// title's containing block must span from its own position all the way to
// the end of the group, so it stays pinned while later titles lock in below
// it. Nesting title[i+1..] inside title[i]'s wrapper gives every title
// exactly that range for free, with no manual height math required.
function StackingTitles({ sections, index, titleRefs, sectionRefs, paraRefs, onSelect }) {
  if (index >= sections.length) return null
  const section = sections[index]

  return (
    <div ref={(el) => (sectionRefs.current[index] = el)} className="relative">
      <button
        type="button"
        ref={(el) => (titleRefs.current[index] = el)}
        onClick={() => onSelect(index)}
        style={{ top: STICKY_TOP + index * TITLE_STACK_GAP, height: TITLE_STACK_GAP }}
        className="sticky z-10 flex w-full cursor-pointer items-center border-t border-[rgba(74,66,56,0.25)] bg-case-bg px-0 text-left font-embodiment"
      >
        <span className="w-9 shrink-0 text-xs tracking-[0.14em] text-[#4a4238] uppercase md:text-base">
          {section.number}
        </span>
        <span className="text-xs tracking-[0.14em] text-[#4a4238] uppercase md:text-base">
          {section.title}
        </span>
      </button>

      <img
        src={section.image}
        alt={section.title}
        draggable={false}
        className="mt-6 mb-6 h-[55vh] w-full select-none rounded-3xl object-cover md:hidden"
      />

      <p
        ref={(el) => (paraRefs.current[index] = el)}
        className="max-w-[85%] pb-16 font-embodiment text-base leading-[150%] tracking-[0.14em] text-[#4a4238] uppercase md:mt-[38vh]"
      >
        {section.paragraph}
      </p>

      <StackingTitles
        sections={sections}
        index={index + 1}
        titleRefs={titleRefs}
        sectionRefs={sectionRefs}
        paraRefs={paraRefs}
        onSelect={onSelect}
      />
    </div>
  )
}

function ProjectDescription({ project }) {
  const paragraphs = project.overview || [project.description]

  return (
    <div className="pt-8 pb-12">
      <div className="mb-6 flex flex-row items-center gap-2">
        <span className="text-[8px] text-maroon">★</span>
        <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238]">
          OVERVIEW
        </span>
      </div>

      <div className="grid w-1/2 grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
        {paragraphs.map((paragraph, i) => (
          <p
            key={i}
            className="m-0 font-embodiment text-base leading-[145%] tracking-[0.06em] text-[#4a4238] uppercase"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

function ProjectFooter({ onBack }) {
  return (
    <div className="py-12 pb-20 text-center">
      <button
        onClick={onBack}
        className="cursor-pointer border-none bg-transparent px-0 py-2 font-sans text-base tracking-[0.14em] text-maroon"
      >
        ← Back to Lobby
      </button>
    </div>
  )
}

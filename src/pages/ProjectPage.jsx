import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState, useLayoutEffect, forwardRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import TicketMenu from '../components/TicketMenu'
import FilmFooter from '../components/FilmFooter'
import studioRoLogo from '../assets/Studio-ro.svg'
import { getLenis } from '../hooks/useLenis'
import { useSiteData } from '../hooks/useSiteData'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'
import { useDocumentHead } from '../hooks/useDocumentHead'
import NotFoundPage from './NotFoundPage'

gsap.registerPlugin(ScrollTrigger)

const TITLE_LOGOS = {
  studioro: studioRoLogo,
}

export default function ProjectPage() {
  const { id }      = useParams()
  const { projects, projectById, loading } = useSiteData()
  const project       = projectById(id)

  useDocumentHead({
    title: project ? `${project.label} — ${project.type || 'Case Study'} | Latimer Studio` : undefined,
    description: project?.tagline || project?.description || undefined,
    path: project ? `/projects/${project.id}` : undefined,
    ogType: 'article',
    jsonLd: project
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.label,
            description: project.tagline || project.description,
            image: project.poster,
            url: `https://latimer.studio/projects/${project.id}`,
            creator: { '@type': 'Organization', name: 'Latimer Studio' },
            datePublished: project.date || project.year || undefined,
            keywords: project.tags?.length ? project.tags.join(', ') : undefined,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://latimer.studio/' },
              { '@type': 'ListItem', position: 2, name: 'Projects', item: 'https://latimer.studio/#projects' },
              { '@type': 'ListItem', position: 3, name: project.label, item: `https://latimer.studio/projects/${project.id}` },
            ],
          },
        ]
      : undefined,
  })

  // Entrance — the case study simply fades onto screen on mount, no
  // transition overlay.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!project) return
    setVisible(false)
    // Always enter a project at the top of the page — the site scroll
    // position (and possibly a `lenis.stop()` from the homepage's scroll
    // lock) carries over from wherever the lobby/theater left off.
    const lenis = getLenis()
    if (lenis) {
      lenis.start()
      lenis.scrollTo(0, { immediate: true, force: true })
    } else {
      window.scrollTo(0, 0)
    }
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [id, project])

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
    if (loading) return null
    return <NotFoundPage />
  }

  return (
    <PageShell visible={visible}>
      <ProjectContent project={project} projects={projects} />
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

function ProjectContent({ project, projects }) {
  return (
    <div className="relative z-5 bg-case-bg">
      <CaseStudyHero project={project} />

      <div className="px-3 pt-16 md:px-5">
        <ProjectDescription project={project} />
        {project.storySections && (
          <ScrollStorySection sections={project.storySections} />
        )}
        {project.testimonial && (
          <ProjectTestimonial testimonial={project.testimonial} />
        )}
      </div>

      <MoreProjectsSection currentId={project.id} projects={projects} />

      <FilmFooter />
    </div>
  )
}

// ─── More projects — two full-bleed cards linking to the other case
// studies, stacked next to each other on desktop and vertically on
// mobile. Each card carries the same overview info as the hero (category
// + date) and a "See Project" button in the same style as the hero's
// "See Site" button.
function MoreProjectsSection({ currentId, projects }) {
  const currentIndex = projects.findIndex((p) => p.id === currentId)
  if (currentIndex === -1 || projects.length < 2) return null

  const count = Math.min(2, projects.length - 1)
  const otherProjects = Array.from({ length: count }, (_, i) => {
    const offset = i + 1
    return projects[(currentIndex + offset) % projects.length]
  })

  return (
    <div className="w-full pt-30">
      <div className="flex flex-row items-center justify-center gap-2 bg-case-bg px-3 py-6 md:px-5">
        <span className="text-[8px] text-maroon">★</span>
        <h2 className="m-0 font-embodiment text-base font-normal tracking-[0.14em] text-[#4a4238]">
          MORE PROJECTS
        </h2>
        <span className="text-[8px] text-maroon">★</span>
      </div>

      <div className="flex flex-col md:flex-row">
        {otherProjects.map((proj) => (
          <MoreProjectCard key={proj.id} project={proj} />
        ))}
      </div>
    </div>
  )
}

// Same caret/panel pattern as the CaseStudyHero's mobile OVERVIEW toggle,
// reused here on every breakpoint since these cards are too compact for an
// always-visible meta row. The card itself navigates on click anywhere
// except the caret and the "See Project" button, which stop propagation
// so they can do their own thing (toggle / navigate) without double-firing.
function MoreProjectCard({ project }) {
  const navigate = useNavigate()
  const [metaOpen, setMetaOpen] = useState(false)
  const panelRef  = useRef(null)
  const fieldRefs = useRef([])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, { opacity: 0, y: 28, scale: 0.6, transformOrigin: 'bottom left' })
    gsap.set(fieldRefs.current.filter(Boolean), { opacity: 0, y: 20 })
  }, [])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const fields = fieldRefs.current.filter(Boolean)
    gsap.killTweensOf([panel, ...fields])

    if (metaOpen) {
      gsap.fromTo(
        panel,
        { opacity: 0, y: 28, scale: 0.6, transformOrigin: 'bottom left' },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }
      )
      gsap.fromTo(
        fields,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.06, delay: 0.06 }
      )
    } else {
      gsap.to(fields, {
        opacity: 0,
        y: 16,
        duration: 0.22,
        ease: 'power1.in',
        stagger: { each: 0.04, from: 'end' },
      })
      gsap.to(panel, {
        opacity: 0,
        y: 28,
        scale: 0.6,
        transformOrigin: 'bottom left',
        duration: 0.3,
        ease: 'power2.inOut',
        delay: 0.06,
      })
    }
  }, [metaOpen])

  const goToProject = () => navigate(`/projects/${project.id}`)

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToProject}
      onKeyDown={(e) => {
        if (e.key === 'Enter') goToProject()
      }}
      className="group relative block h-[70vh] min-h-105 w-full cursor-pointer overflow-hidden bg-ink md:h-[85vh] md:flex-1"
    >
      <img
        src={optimizedImageUrl(project.poster, { width: 1200 })}
        srcSet={srcSetFor(project.poster, [480, 768, 1200, 1800])}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt={project.label}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.75)_100%)]" />

      <h3 className="absolute top-8 left-3 m-0 font-embodiment text-[3rem] leading-[0.9] font-light tracking-[-1px] text-cream uppercase md:left-5">
        {project.label}
      </h3>

      <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-6 md:left-5 md:right-5">
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMetaOpen((v) => !v)
            }}
            className="flex cursor-pointer flex-row items-center gap-2 border-none bg-transparent px-0 py-1"
          >
            <svg
              viewBox="0 0 12 8"
              className={`h-2 w-3 stroke-cream stroke-2 transition-transform duration-300 ${
                metaOpen ? 'rotate-180' : ''
              }`}
              fill="none"
            >
              <path d="M1 1L6 6L11 1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-embodiment text-base tracking-[0.14em] text-cream">
              OVERVIEW
            </span>
          </button>

          <div
            ref={panelRef}
            className={`absolute bottom-full left-0 mb-3 flex flex-col items-start gap-4 whitespace-nowrap ${
              metaOpen ? '' : 'pointer-events-none'
            }`}
          >
            <div ref={(el) => (fieldRefs.current[0] = el)}>
              <MetaField label="PROJECT" value={project.number} />
            </div>
            {project.industry && (
              <div ref={(el) => (fieldRefs.current[1] = el)}>
                <MetaField label="INDUSTRY" value={project.industry} />
              </div>
            )}
            {project.category && (
              <div ref={(el) => (fieldRefs.current[2] = el)}>
                <MetaField label="CATEGORY" value={project.category} />
              </div>
            )}
            <div ref={(el) => (fieldRefs.current[3] = el)}>
              <MetaField label="DATE" value={project.date || project.year} />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goToProject()
          }}
          className="btn-scoop inline-block cursor-pointer whitespace-nowrap border-cream px-5.5 py-2.5 font-embodiment text-base tracking-[0.14em] text-cream transition-colors duration-200 ease-out group-hover:bg-white group-hover:text-ink"
        >
          SEE PROJECT
        </button>
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
  const [metaOpen, setMetaOpen] = useState(false)
  const panelRef  = useRef(null)
  const fieldRefs = useRef([])

  // Panel + fields stay mounted at all times (so the close tween has
  // something to animate) and simply start hidden, pulled in tight
  // against the OVERVIEW trigger. Opening springs everything up and
  // out from that spot; closing mirrors the same path back down into
  // the text, just quicker and without the overshoot.
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, { opacity: 0, y: 28, scale: 0.6, transformOrigin: 'bottom left' })
    gsap.set(fieldRefs.current.filter(Boolean), { opacity: 0, y: 20 })
  }, [])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const fields = fieldRefs.current.filter(Boolean)
    gsap.killTweensOf([panel, ...fields])

    if (metaOpen) {
      gsap.fromTo(
        panel,
        { opacity: 0, y: 28, scale: 0.6, transformOrigin: 'bottom left' },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.6)' }
      )
      gsap.fromTo(
        fields,
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.06, delay: 0.06 }
      )
    } else {
      gsap.to(fields, {
        opacity: 0,
        y: 16,
        duration: 0.22,
        ease: 'power1.in',
        stagger: { each: 0.04, from: 'end' },
      })
      gsap.to(panel, {
        opacity: 0,
        y: 28,
        scale: 0.6,
        transformOrigin: 'bottom left',
        duration: 0.3,
        ease: 'power2.inOut',
        delay: 0.06,
      })
    }
  }, [metaOpen])

  return (
    <div className="relative h-[100vh] min-h-[520px] w-full overflow-hidden bg-ink">
      <img
        src={optimizedImageUrl(project.poster, { width: 1920 })}
        srcSet={srcSetFor(project.poster, [768, 1200, 1920, 2560])}
        sizes="100vw"
        alt={project.label}
        draggable={false}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover object-[center_25%]"
      />

      {/* Top + bottom gradients for text legibility over the image */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0)_30%,rgba(0,0,0,0)_60%,rgba(0,0,0,0.75)_100%)]" />

      {/* Title + tagline */}
      <div className="absolute top-8 left-3 right-3 md:left-5 md:right-5">
        {TITLE_LOGOS[project.id] ? (
          <>
            {/* Logo art carries the visual title, so it doesn't produce a
                real heading on its own — this hidden h1 gives the page an
                actual (crawlable, screen-reader-visible) title. */}
            <h1 className="sr-only">{project.label}</h1>
            <img
              src={TITLE_LOGOS[project.id]}
              alt={project.label}
              className="mb-2 block h-auto w-full md:max-w-144.5"
            />
          </>
        ) : (
          <h1 className="mb-2 font-3don text-[200px] leading-[0.9] font-light tracking-[-1px] text-cream">
            {project.label.replace(' ', '-')}
          </h1>
        )}
        <h2 className="sr-only">
          {project.label} — {project.category || project.type} case study by Latimer Studio
          {project.industry ? `, a ${project.industry.toLowerCase()} brand` : ''}.
        </h2>
        {project.tagline && (
          <p className="m-0 font-embodiment text-base leading-[145%] uppercase tracking-[0.06em] text-cream">
            {project.tagline}
          </p>
        )}
      </div>

      {/* Bottom meta strip — mobile gets the collapsible OVERVIEW caret,
          desktop just shows the fields inline in a row. */}
      <div className="absolute left-3 right-3 bottom-3 flex items-end justify-between gap-6 md:left-5 md:right-5">
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setMetaOpen((v) => !v)}
            className="flex cursor-pointer flex-row items-center gap-2 border-none bg-transparent px-0 py-1"
          >
            <svg
              viewBox="0 0 12 8"
              className={`h-2 w-3 stroke-cream stroke-2 transition-transform duration-300 ${
                metaOpen ? 'rotate-180' : ''
              }`}
              fill="none"
            >
              <path d="M1 1L6 6L11 1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-embodiment text-base tracking-[0.14em] text-cream">
              OVERVIEW
            </span>
          </button>

          <div
            ref={panelRef}
            className={`absolute bottom-full left-0 mb-3 flex flex-col items-start gap-4 whitespace-nowrap ${
              metaOpen ? '' : 'pointer-events-none'
            }`}
          >
            <div ref={(el) => (fieldRefs.current[0] = el)}>
              <MetaField label="PROJECT" value={project.number} />
            </div>
            {project.industry && (
              <div ref={(el) => (fieldRefs.current[1] = el)}>
                <MetaField label="INDUSTRY" value={project.industry} />
              </div>
            )}
            {project.category && (
              <div ref={(el) => (fieldRefs.current[2] = el)}>
                <MetaField label="CATEGORY" value={project.category} />
              </div>
            )}
            <div ref={(el) => (fieldRefs.current[3] = el)}>
              <MetaField label="DATE" value={project.date || project.year} />
            </div>
          </div>
        </div>

        <div className="hidden flex-row items-center gap-8 md:flex">
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
//
// Each section can hold several image+paragraph combos. Combos are also
// flattened into one ordered list so every paragraph can be paired with its
// image by index — the right-hand image column and the title column render
// separately, but combos stay matched up in source order.
//
// The first title pins flush to the very top of the viewport (0), so it
// locks in at exactly the scroll position where the first image's top
// would otherwise have scrolled past that same edge — title and image stop
// moving at the same moment, no gap or jump between them.
const STICKY_TOP        = 0
const TITLE_STACK_GAP   = 40  // px added per stacked title

// Renders a combo's video when present, falling back to its image. Both
// share the same ref (for the gsap reveal animation) and sizing classes.
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

function ScrollStorySection({ sections }) {
  const containerRef = useRef(null)
  const titleRefs    = useRef([])
  const sectionRefs   = useRef([])
  const paraRefs      = useRef([])
  const imageRefs     = useRef([])

  const comboOffsets = sections.reduce((offsets) => {
    const prevStart = offsets.length ? offsets[offsets.length - 1] : 0
    const prevCount = offsets.length ? (sections[offsets.length - 1].combos || []).length : 0
    offsets.push(prevStart + prevCount)
    return offsets
  }, [])
  const flatCombos = sections.flatMap((section) => section.combos || [])

  // Keeps every section's title top lined up with its first image/video's
  // top, and every paragraph's bottom lined up with its image/video's
  // bottom. The two columns stack independently (fixed-height sticky title
  // bars + variable-height text on the left, fixed-aspect squares on the
  // right), so their natural flow drifts apart after the first pair — this
  // measures the real rendered position of each piece and nudges it to
  // close the gap. Runs section by section, top to bottom, so each nudge is
  // accounted for before the next position is measured (a title's shift
  // moves its own paragraph too, which is why paragraphs are re-measured
  // after their title is placed, not before). gsap's reveal transforms are
  // visual-only, so they're neutralized during the measurement pass to
  // avoid reading a skewed position for elements that haven't scrolled
  // into view yet.
  //
  // A title is never pulled up past the bottom of the previous section's
  // last paragraph (plus a small breathing gap) — a long paragraph can put
  // its bottom below where the next image starts, and without this clamp
  // the title (opaque background, its own stacking layer) would slide up
  // over that still-visible text instead of just landing a little later
  // than its image.
  const TITLE_MIN_GAP = 24

  useLayoutEffect(() => {
    function alignStoryLayout() {
      if (window.innerWidth < 768) return

      const titles = titleRefs.current
      const paras = paraRefs.current
      const media = imageRefs.current

      const savedParaTransforms = paras.map((el) => el?.style.transform)
      const savedMediaTransforms = media.map((el) => el?.style.transform)
      paras.forEach((el) => el && (el.style.transform = 'none'))
      media.forEach((el) => el && (el.style.transform = 'none'))
      paras.forEach((el) => el && (el.style.marginTop = '0px'))
      titles.forEach((el) => el && (el.style.marginTop = '0px'))

      let previousParaBottom = null

      sections.forEach((section, s) => {
        const title = titles[s]
        const firstMedia = media[comboOffsets[s]]
        if (title && firstMedia) {
          const titleTop = title.getBoundingClientRect().top
          const mediaTop = firstMedia.getBoundingClientRect().top
          let margin = mediaTop - titleTop
          if (previousParaBottom !== null) {
            margin = Math.max(margin, previousParaBottom + TITLE_MIN_GAP - titleTop)
          }
          title.style.marginTop = `${margin}px`
        }

        const combos = section.combos || []
        combos.forEach((_, j) => {
          const i = comboOffsets[s] + j
          const para = paras[i]
          const mediaEl = media[i]
          if (!para || !mediaEl) return
          const paraRect = para.getBoundingClientRect()
          const mediaRect = mediaEl.getBoundingClientRect()
          const margin = Math.max(0, mediaRect.bottom - paraRect.bottom)
          para.style.marginTop = `${margin}px`
          previousParaBottom = para.getBoundingClientRect().bottom
        })
      })

      paras.forEach((el, i) => el && (el.style.transform = savedParaTransforms[i] ?? ''))
      media.forEach((el, i) => el && (el.style.transform = savedMediaTransforms[i] ?? ''))
    }

    alignStoryLayout()
    document.fonts?.ready?.then(alignStoryLayout)

    const ro = new ResizeObserver(alignStoryLayout)
    if (containerRef.current) ro.observe(containerRef.current)
    window.addEventListener('resize', alignStoryLayout)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', alignStoryLayout)
    }
  }, [sections, comboOffsets])

  // Lenis drives scrolling by smoothing/animating the real scroll position
  // rather than letting the browser scroll natively, and browsers can let a
  // `position: sticky` element's stuck/unstuck state go stale when scroll
  // updates arrive that way — a title can stay pinned to the top well past
  // where it should release, then jump back once something forces a
  // layout recalculation. Reading a layout property on every title each
  // scroll tick forces that recalculation continuously, keeping the stuck
  // state accurate instead of stale.
  useEffect(() => {
    const lenis = getLenis()
    if (!lenis) return

    function nudgeStickyRecalc() {
      titleRefs.current.forEach((el) => {
        if (el) void el.getBoundingClientRect()
      })
    }

    lenis.on('scroll', nudgeStickyRecalc)
    return () => lenis.off('scroll', nudgeStickyRecalc)
  }, [])

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
    const lenis = getLenis()
    const offset = -(STICKY_TOP + index * TITLE_STACK_GAP)
    if (lenis) {
      lenis.scrollTo(target, { offset, duration: 1.1 })
    } else {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div ref={containerRef} className="grid gap-x-10 md:grid-cols-[1fr_2fr]">
      {/* Pinned, stacking-title scroll story — the titles pin and stack the
          same way on every breakpoint. On mobile each title carries its own
          images inline (no separate scrolling column); on desktop the images
          live in the column on the right and scroll independently. */}
      <div>
        <StackingTitles
          sections={sections}
          index={0}
          comboOffsets={comboOffsets}
          titleRefs={titleRefs}
          sectionRefs={sectionRefs}
          paraRefs={paraRefs}
          onSelect={scrollToSection}
        />
      </div>

      <div className="hidden flex-col gap-6 pb-16 md:flex">
        {flatCombos.map((combo, i) => (
          <ComboMedia
            key={i}
            ref={(el) => (imageRefs.current[i] = el)}
            combo={combo}
            className="aspect-square w-full select-none rounded-3xl object-cover"
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
function StackingTitles({ sections, index, comboOffsets, titleRefs, sectionRefs, paraRefs, onSelect }) {
  if (index >= sections.length) return null
  const section = sections[index]
  const combos = section.combos || []
  const comboStart = comboOffsets[index]

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
        <h3 className="m-0 text-xs font-normal tracking-[0.14em] text-[#4a4238] uppercase md:text-base">
          {section.title}
        </h3>
      </button>

      {combos.map((combo, j) => (
        <div key={j} className="pb-16">
          <ComboMedia
            combo={combo}
            alt={section.title}
            className="mt-6 mb-6 aspect-square w-full select-none rounded-3xl object-cover md:hidden"
          />

          <p
            ref={(el) => (paraRefs.current[comboStart + j] = el)}
            className="max-w-[85%] text-justify font-embodiment text-base leading-[150%] tracking-[0.14em] text-[#4a4238] uppercase"
          >
            {combo.paragraph}
          </p>
        </div>
      ))}

      <StackingTitles
        sections={sections}
        index={index + 1}
        comboOffsets={comboOffsets}
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
  const hasSkills = project.tools?.length || project.services?.length

  return (
    <div className="pt-8 pb-30">
      <div className="mb-6 flex flex-row items-center gap-2">
        <span className="text-[8px] text-maroon">★</span>
        <h2 className="m-0 font-embodiment text-base font-normal tracking-[0.14em] text-[#4a4238]">
          MANDATE
        </h2>
      </div>

      <div className="flex flex-col gap-10 md:flex-row md:justify-between">
        <div className="grid w-full grid-cols-1 gap-x-12 gap-y-6 md:w-1/2 md:grid-cols-2">
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="m-0 font-embodiment text-base leading-[145%] tracking-[0.06em] text-[#4a4238] uppercase"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {hasSkills && (
          <div className="flex flex-row gap-12">
            {project.tools?.length > 0 && (
              <SkillList label="TOOLS" items={project.tools} />
            )}
            {project.services?.length > 0 && (
              <SkillList label="SERVICES" items={project.services} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SkillList({ label, items }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-embodiment text-base tracking-[0.14em] text-[#4a4238]">
        {label}
      </span>
      <div className="flex flex-col items-start gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="whitespace-nowrap rounded-md border border-[#4a4238]/35 px-3 py-1 font-embodiment text-base tracking-[0.1em] text-[#4a4238] uppercase"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProjectTestimonial({ testimonial }) {
  return (
    <div className="pt-8 pb-30">
      <div className="mb-6 flex flex-row items-center gap-2">
        <span className="text-[8px] text-maroon">★</span>
        <h2 className="m-0 font-embodiment text-base font-normal tracking-[0.14em] text-[#4a4238] uppercase">
          {testimonial.name}
        </h2>
      </div>

      <p className="m-0 w-full font-embodiment text-[2rem] leading-[120%] tracking-[0.06em] text-[#4a4238] uppercase md:text-[3rem]">
        {testimonial.quote}
      </p>
    </div>
  )
}

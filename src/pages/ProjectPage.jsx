import { useParams, useNavigate } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import { PROJECTS as PROJECT_LIST } from '../data/projects'
import TicketMenu from '../components/TicketMenu'
import studioRoLogo from '../assets/Studio-ro.svg'

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
      <LobbyLink onBack={handleBack} />
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

// Persistent top-left exit — always reachable without scrolling to the footer.
function LobbyLink({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="fixed top-6 left-5 z-1500 cursor-pointer border-none bg-transparent px-0 py-2 font-sans text-base tracking-[0.2em] text-[rgba(244,237,226,0.75)] mix-blend-difference"
    >
      ← LOBBY
    </button>
  )
}

function ProjectContent({ project, onBack }) {
  return (
    <div className="relative z-5 bg-case-bg">
      <CaseStudyHero project={project} />

      <div className="px-5 pt-16">
        <ProjectDescription project={project} />
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
      <div className="absolute top-8 left-5 right-5">
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
      <div className="absolute left-5 right-5 bottom-6 flex items-center justify-between gap-6">
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

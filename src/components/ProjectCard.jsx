import { useRef, useState, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import LetsTalkButton from './LetsTalkButton'
import { optimizedImageUrl, srcSetFor } from '../lib/sanityImage'

// Same caret/panel pattern as the CaseStudyHero's mobile OVERVIEW toggle,
// reused here on every breakpoint since these cards are too compact for an
// always-visible meta row. The card itself navigates on click anywhere
// except the caret and the "See Project" button, which stop propagation
// so they can do their own thing (toggle / navigate) without double-firing.
export default function ProjectCard({ project, className = '' }) {
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
      className={`group relative isolate block cursor-pointer overflow-hidden bg-ink [contain:paint] ${className}`}
    >
      <img
        src={optimizedImageUrl(project.poster, { width: 1200 })}
        srcSet={srcSetFor(project.poster, [480, 768, 1200, 1800])}
        sizes="(min-width: 768px) 50vw, 100vw"
        alt={project.label}
        draggable={false}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover transform-gpu will-change-transform transition-transform duration-500 ease-out group-hover:scale-[1.01]"
      />

      <div className="pointer-events-none absolute inset-0 transform-gpu bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0.97)_100%)] md:bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_35%,rgba(0,0,0,0)_55%,rgba(0,0,0,0.75)_100%)]" />

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

        <LetsTalkButton
          label="See Project"
          to={`/projects/${project.id}`}
          inverted
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  )
}

export function MetaField({ label, value }) {
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

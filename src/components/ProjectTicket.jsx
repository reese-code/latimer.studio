import { forwardRef } from 'react'
import blankTicket from '../assets/blank_ticket.png'

// ---------------------------------------------------------------------------
// ProjectTicket — the "now showing" ticket that pops up in the project
// section. Visual language (fonts, colors, star glyphs) matches the nav
// ticket (TicketMenu) exactly — same font-families & sizes are reused so the
// two tickets feel like a single system.
//
// The ticket's own perforated side flaps act as "PREVIOUS PROJECT" /
// "NEXT PROJECT" controls on every breakpoint, mobile included — no
// separate round arrow buttons.
//
// The outer wrapper below handles horizontal centering only (fixed +
// translateX(-50%)); the forwarded ref sits on the inner element and is
// used exclusively for GSAP's vertical slide animations (show / hide /
// swap between projects), matching the pattern used by TicketMenu.
// ---------------------------------------------------------------------------
const ProjectTicket = forwardRef(function ProjectTicket(
  { project, onPrev, onNext, onEnter, isMobile },
  ref
) {
  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[900]"
      style={{ width: isMobile ? 'min(92vw, 430px)' : '580px' }}
    >
      {/* ref lives here — GSAP animates this element's Y position only,
          so it never fights with the horizontal centering transform above */}
      <div ref={ref} className="relative w-full will-change-transform">
        <img
          src={blankTicket}
          alt=""
          draggable={false}
          className="block w-full h-auto select-none"
        />

        {/* Left flap — Previous project */}
        <button
          onClick={onPrev}
          aria-label="Previous project"
          className="group absolute top-0 left-0 flex h-full w-[14%] items-center justify-center border-none bg-transparent p-0 cursor-pointer"
        >
          <span className="flex items-center justify-center border-y border-[rgba(114,47,55,0.4)] px-1 py-3 transition-colors duration-200 ease-out group-hover:border-maroon">
            <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap font-sans font-medium text-xs md:text-base tracking-[0.2em] text-[rgba(114,47,55,0.65)] transition-colors duration-200 ease-out select-none group-hover:text-maroon">
              PREVIOUS PROJECT
            </span>
          </span>
        </button>

        {/* Right flap — Next project */}
        <button
          onClick={onNext}
          aria-label="Next project"
          className="group absolute top-0 right-0 flex h-full w-[14%] items-center justify-center border-none bg-transparent p-0 cursor-pointer"
        >
          <span className="flex items-center justify-center border-y border-[rgba(114,47,55,0.4)] px-1 py-3 transition-colors duration-200 ease-out group-hover:border-maroon">
            <span className="[writing-mode:vertical-rl] whitespace-nowrap font-sans font-medium text-xs md:text-base tracking-[0.2em] text-[rgba(114,47,55,0.65)] transition-colors duration-200 ease-out select-none group-hover:text-maroon">
              NEXT PROJECT
            </span>
          </span>
        </button>

        {/* Center content */}
        <div className="absolute top-0 left-[15%] right-[15%] box-border flex h-full flex-col items-center justify-center gap-1.5 px-1.5 py-1">
          {/* Brand row — same font/size as nav ticket links + stars */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-maroon">★</span>
            <span className="font-sans font-medium text-xs md:text-base tracking-[0.22em] text-maroon select-none">
              LATIMER STUDIO
            </span>
            <span className="text-[8px] text-maroon">★</span>
          </div>

          {/* Project title — PPPlayground, same family as nav ticket title */}
          <div
            className="whitespace-nowrap text-center font-heading font-light leading-none tracking-[-1px] text-maroon select-none"
            style={{ fontSize: isMobile ? '40px' : '58px' }}
          >
            {project.label}
          </div>

          {/* Meta row — date and the service provided (e.g. "Brand
              Identity"), consistent across every project's ticket. */}
          <div className="flex items-center gap-2 whitespace-nowrap font-sans font-medium text-xs md:text-base tracking-[0.1em] text-[#4a3a42] select-none">
            <span>PROJECT: {project.number}</span>
            <span className="text-[6px] text-maroon">|</span>
            <span>{project.date || project.year}</span>
            <span className="text-[6px] text-maroon">|</span>
            <span>{project.type.toUpperCase()}</span>
          </div>

          {/* See Project button — same cut-out "scoop" treatment as the
              case-study hero's See Site / See Project buttons, with the
              scoop color swapped to maroon (via --scoop-color) to sit on
              the ticket's cream background instead of a dark photo. */}
          <button
            onClick={onEnter}
            className="btn-scoop [--scoop-color:var(--color-maroon)] mt-1 cursor-pointer select-none whitespace-nowrap px-[30px] py-[9px] font-sans font-medium text-base tracking-[0.25em] text-maroon transition-colors duration-200 ease-out hover:bg-maroon hover:text-cream"
          >
            See Project
          </button>
        </div>
      </div>
    </div>
  )
})

export default ProjectTicket

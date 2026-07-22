import { forwardRef, useState } from 'react'
import blankTicket from '../assets/blank_ticket.png'

// ---------------------------------------------------------------------------
// ProjectTicket — the "now showing" ticket that pops up in the project
// section. Visual language (fonts, colors, star glyphs) matches the nav
// ticket (TicketMenu) exactly — same font-families & sizes are reused so the
// two tickets feel like a single system.
//
// Desktop: the ticket's own perforated side flaps act as
//          "PREVIOUS PROJECT" / "NEXT PROJECT" controls.
// Mobile:  flaps are hidden (too narrow to read) and the classic round
//          arrow buttons (rendered by the parent) are used instead, with
//          the ticket centered.
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
  const [hoverBtn, setHoverBtn] = useState(false)
  const [hoverPrev, setHoverPrev] = useState(false)
  const [hoverNext, setHoverNext] = useState(false)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'min(92vw, 430px)' : '580px',
        zIndex: 900,
      }}
    >
      {/* ref lives here — GSAP animates this element's Y position only,
          so it never fights with the horizontal centering transform above */}
      <div ref={ref} style={{ position: 'relative', width: '100%', willChange: 'transform' }}>
        <img
          src={blankTicket}
          alt=""
          draggable={false}
          style={{ width: '100%', height: 'auto', display: 'block', userSelect: 'none' }}
        />

        {/* Left flap — Previous project (desktop only) */}
        {!isMobile && (
          <button
            onClick={onPrev}
            onMouseEnter={() => setHoverPrev(true)}
            onMouseLeave={() => setHoverPrev(false)}
            aria-label="Previous project"
            style={{ ...flapButtonStyle, left: 0 }}
          >
            <span
              style={{
                ...flapTextWrapStyle,
                borderColor: hoverPrev ? '#722F37' : 'rgba(114,47,55,0.4)',
              }}
            >
              <span
                style={{
                  ...flapTextStyle,
                  transform: 'rotate(180deg)',
                  color: hoverPrev ? '#722F37' : 'rgba(114,47,55,0.65)',
                }}
              >
                PREVIOUS PROJECT
              </span>
            </span>
          </button>
        )}

        {/* Right flap — Next project (desktop only) */}
        {!isMobile && (
          <button
            onClick={onNext}
            onMouseEnter={() => setHoverNext(true)}
            onMouseLeave={() => setHoverNext(false)}
            aria-label="Next project"
            style={{ ...flapButtonStyle, right: 0 }}
          >
            <span
              style={{
                ...flapTextWrapStyle,
                borderColor: hoverNext ? '#722F37' : 'rgba(114,47,55,0.4)',
              }}
            >
              <span
                style={{
                  ...flapTextStyle,
                  color: hoverNext ? '#722F37' : 'rgba(114,47,55,0.65)',
                }}
              >
                NEXT PROJECT
              </span>
            </span>
          </button>
        )}

        {/* Center content */}
        <div style={centerContentStyle}>
          {/* Brand row — same font/size as nav ticket links + stars */}
          <div style={brandRowStyle}>
            <span style={starStyle}>★</span>
            <span style={brandTextStyle}>LATIMER STUDIO</span>
            <span style={starStyle}>★</span>
          </div>

          {/* Project title — PPPlayground, same family as nav ticket title */}
          <div style={{ ...titleStyle, fontSize: isMobile ? '40px' : '58px' }}>
            {project.label}
          </div>

          {/* Meta row */}
          <div style={metaRowStyle}>
            <span>PROJECT: {project.number}</span>
            <span style={dotStyle}>|</span>
            <span>{project.year}</span>
            <span style={dotStyle}>|</span>
            <span>{project.type.toUpperCase()}</span>
          </div>

          {/* See Project button */}
          <button
            onClick={onEnter}
            onMouseEnter={() => setHoverBtn(true)}
            onMouseLeave={() => setHoverBtn(false)}
            style={{
              ...seeProjectBtnStyle,
              background: hoverBtn ? '#8a3a44' : '#722F37',
            }}
          >
            See Project
          </button>
        </div>
      </div>
    </div>
  )
})

export default ProjectTicket

// ─── Styles ─────────────────────────────────────────────────────────────────

const flapButtonStyle = {
  position: 'absolute',
  top: 0,
  width: '14%',
  height: '100%',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

// Thin border lines bracketing the vertical PREVIOUS/NEXT PROJECT text,
// matching the ticket-stub mockup.
const flapTextWrapStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderTop: '1px solid',
  borderBottom: '1px solid',
  borderColor: 'rgba(114,47,55,0.4)',
  padding: '12px 4px',
  transition: 'border-color 0.2s ease',
}

const flapTextStyle = {
  writingMode: 'vertical-rl',
  fontFamily: 'OTNeueMontreal, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: '0.2em',
  whiteSpace: 'nowrap',
  transition: 'color 0.2s ease',
  userSelect: 'none',
}

const centerContentStyle = {
  position: 'absolute',
  left: '15%',
  right: '15%',
  top: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  boxSizing: 'border-box',
  padding: '4px 6px',
}

const brandRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}

const starStyle = {
  fontSize: '8px',
  color: '#722F37',
}

const brandTextStyle = {
  fontFamily: 'OTNeueMontreal, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: '0.22em',
  color: '#722F37',
  userSelect: 'none',
}

const titleStyle = {
  fontFamily: 'PPPlayground, serif',
  fontWeight: 300,
  color: '#722F37',
  lineHeight: 1,
  letterSpacing: '-1px',
  textAlign: 'center',
  userSelect: 'none',
  whiteSpace: 'nowrap',
}

const metaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'OTNeueMontreal, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: '0.1em',
  color: '#4a3a42',
  userSelect: 'none',
  whiteSpace: 'nowrap',
}

const dotStyle = {
  fontSize: '6px',
  color: '#722F37',
}

const seeProjectBtnStyle = {
  marginTop: '4px',
  border: 'none',
  color: '#f4ede2',
  fontFamily: 'OTNeueMontreal, sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  letterSpacing: '0.25em',
  padding: '9px 30px',
  borderRadius: '3px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
  userSelect: 'none',
}

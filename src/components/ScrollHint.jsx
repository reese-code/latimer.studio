// ScrollHint — flips between the two opening-gate prompts, centered in the
// viewport above the charge progress bar (see PosterGallery's shared
// wrapper). "Scroll down to enter" sits in the top row until the very first
// scroll input, then the whole stack shifts up one row so "Keep scrolling
// down" takes its place — a rolling-counter flip rather than two
// independently-faded prompts. Stays up through every pre-poster phase.
export default function ScrollHint({ showEnter, showKeepScrolling }) {
  const visible = showEnter || showKeepScrolling

  return (
    <div
      className="pointer-events-none overflow-hidden"
      style={{
        height: '1.5rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          transform: showKeepScrolling ? 'translateY(-1.5rem)' : 'translateY(0)',
          transition: 'transform 0.6s ease',
        }}
      >
        <p className="flex h-6 items-center justify-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-white select-none">
          Scroll down to enter
        </p>
        <p className="flex h-6 items-center justify-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-white/80 select-none">
          Keep scrolling down
        </p>
      </div>
    </div>
  )
}

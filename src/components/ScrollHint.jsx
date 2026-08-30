// ScrollHint — the single rolling-counter text strip pinned above the charge
// progress bar (see PosterGallery's shared wrapper). It never disappears:
// instead of fading each line in/out independently, the whole stack just
// shifts up one row at a time as the experience moves through its phases,
// so there's always a line of copy sitting in view.
const LINES = [
  'Scroll down to enter',
  'Keep scrolling down',
  'Tap to enter theater',
  'Scroll to change project',
]

export default function ScrollHint({ index }) {
  return (
    <div className="pointer-events-none overflow-hidden" style={{ height: '1.5rem' }}>
      <div
        style={{
          transform: `translateY(-${index * 1.5}rem)`,
          transition: 'transform 0.6s ease',
        }}
      >
        {LINES.map((line, i) => (
          <p
            key={line}
            className="flex h-6 items-center justify-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-white select-none"
            style={{ opacity: i === 1 || i === 3 ? 0.8 : 1 }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

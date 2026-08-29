// PosterHint — the poster-gallery counterpart to ScrollHint. Sits in the same
// centered slot once the poster gate is active: "Tap to enter theater" while
// the gate sits idle (no charge), flipping down to "Scroll to change project"
// the moment scroll input starts charging it — mirrors ScrollHint's rolling
// flip rather than an independent fade.
export default function PosterHint({ visible, charging }) {
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
          transform: charging ? 'translateY(-1.5rem)' : 'translateY(0)',
          transition: 'transform 0.6s ease',
        }}
      >
        <p className="flex h-6 items-center justify-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-white select-none">
          Tap to enter theater
        </p>
        <p className="flex h-6 items-center justify-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-white/80 select-none">
          Scroll to change project
        </p>
      </div>
    </div>
  )
}

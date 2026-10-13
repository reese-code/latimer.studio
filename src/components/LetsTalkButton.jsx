import { Link } from 'react-router-dom'

// New pill button for the homepage — distinct from TicketMenu's old
// ticket-png-background button, which stays as-is in cinema mode.
export default function LetsTalkButton({ className = '', inverted = false, arrowAlways = false, ...props }) {
  return (
    <Link
      to="/contact"
      className={`group relative inline-flex items-center justify-center rounded-lg px-8 py-3 text-body-caps no-underline ${inverted ? 'bg-white text-ink' : 'bg-ink text-white'} ${className}`}
      {...props}
    >
      {/* Label — two stacked copies in a clipped line-height-tall box;
          hovering slides the whole stack up one line, swapping in the
          second copy as if it were waiting just out of view below. */}
      <span className="relative block h-[1em] overflow-hidden leading-none">
        <span className="block transition-transform duration-300 ease-out group-hover:-translate-y-full">
          Let&rsquo;s talk
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 block translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0"
        >
          Let&rsquo;s talk
        </span>
      </span>

      {/* Arrow — absolutely positioned, so it never adds to the button's
          own box size. Hidden at rest; slides in from the right on hover. */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 ${arrowAlways ? 'translate-x-0 opacity-100' : 'translate-x-2 opacity-0'}`}
      >
        <path d="M1.82812 11.8789L11.8281 1.87891" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M1.82812 1.87891H11.8281V11.8789" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

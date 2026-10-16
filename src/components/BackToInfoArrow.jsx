import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export const ARTICLE_PAGE_ROOT_ID = 'article-page-root'

// ---------------------------------------------------------------------------
// BackToInfoArrow — the "Back out" button on article pages, placed just
// below the site nav at the very top of the page. It's absolutely positioned
// in the page, so it scrolls away with the content on every breakpoint.
// Hovering rotates the arrow 45° counterclockwise. Clicking navigates back
// to /info.
// ---------------------------------------------------------------------------
export default function BackToInfoArrow() {
  const navigate = useNavigate()

  const handleClick = useCallback(() => {
    navigate('/info')
  }, [navigate])

  return (
    <div
      className="absolute inset-x-0 z-40 flex items-center px-2 py-2 md:px-5"
      style={{
        top: 'var(--navbar-height, 56px)',
        background: "var(--color-bg) url('/concrete-texture.png') repeat fixed center top",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Back to info"
        className="group flex flex-row items-center gap-2 text-ink transition-colors duration-200 hover:text-maroon"
      >
        <svg
          // 13:12 source aspect ratio, height pinned to 0.7em of the label.
          width="0.758em"
          height="0.7em"
          viewBox="0 0 13 12"
          fill="none"
          className="text-body-caps shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-45"
        >
          <path
            d="M11.6484 10.9629L1.64844 0.962891"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M1.64844 10.9629V0.962891H11.6484"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-body-caps">Back out</span>
      </button>
    </div>
  )
}

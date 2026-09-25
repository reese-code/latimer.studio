import { useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { getLenis } from '../hooks/useLenis'
import { triggerPageShrinkTransition } from '../lib/pageShrinkTransition'

export const ARTICLE_PAGE_ROOT_ID = 'article-page-root'

const SCROLL_THRESHOLD = 10

// ---------------------------------------------------------------------------
// BackToInfoArrow — a thin bar pinned to the top of the screen on article
// pages, tall enough to sit visibly over whatever content is scrolled
// underneath it. Hidden by default once the reader scrolls down; scrolling
// back up (or being at the very top) reveals it, mirroring TicketMenu's
// scroll-direction logic. Hovering rotates the arrow 45° counterclockwise
// (toward due-left). Clicking shrinks the whole page away toward the center
// of the screen, with the Info page already rendered behind it, and
// navigates back to /info, which loads scrolled to the top.
// ---------------------------------------------------------------------------
export default function BackToInfoArrow() {
  const navigate = useNavigate()
  const barRef = useRef(null)
  const hiddenRef = useRef(false)
  const lastDecisionScrollRef = useRef(0)

  const resolveVisibility = useCallback(() => {
    if (!barRef.current) return
    gsap.to(barRef.current, {
      y: hiddenRef.current ? '-100%' : '0%',
      duration: 0.45,
      ease: 'power3.inOut',
    })
  }, [])

  useEffect(() => {
    const onScroll = ({ scroll }) => {
      if (scroll <= 4) {
        if (hiddenRef.current) {
          hiddenRef.current = false
          lastDecisionScrollRef.current = scroll
          resolveVisibility()
        }
        return
      }
      const delta = scroll - lastDecisionScrollRef.current
      if (delta > SCROLL_THRESHOLD) {
        hiddenRef.current = true
        lastDecisionScrollRef.current = scroll
        resolveVisibility()
      } else if (delta < -SCROLL_THRESHOLD) {
        hiddenRef.current = false
        lastDecisionScrollRef.current = scroll
        resolveVisibility()
      }
    }

    // Parent's useLenis() effect (which instantiates the singleton) can
    // still be un-run on this component's first effect pass — retry each
    // frame until it's ready rather than silently no-op'ing.
    let lenis = null
    let rafId = null
    let cancelled = false
    const trySubscribe = () => {
      lenis = getLenis()
      if (lenis) {
        lenis.on('scroll', onScroll)
      } else if (!cancelled) {
        rafId = requestAnimationFrame(trySubscribe)
      }
    }
    trySubscribe()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      lenis?.off('scroll', onScroll)
    }
  }, [resolveVisibility])

  const handleClick = useCallback(() => {
    const rootEl = document.getElementById(ARTICLE_PAGE_ROOT_ID)
    triggerPageShrinkTransition(navigate, '/info', { rootEl })
  }, [navigate])

  return (
    <div
      ref={barRef}
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-ink/10 bg-cream px-6 md:h-16 md:px-8"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Back to info"
        className="group flex flex-row items-center gap-2 text-base text-ink transition-colors duration-200 hover:text-maroon"
      >
        <svg
          // 13:12 source aspect ratio, height pinned to 0.7em (30% smaller
          // than the label's font size) so it still scales with text-base.
          width="0.758em"
          height="0.7em"
          viewBox="0 0 13 12"
          fill="none"
          className="shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-45"
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
        {/* Matches StoryAccordion's paragraph text size (text-base) so the
            label reads at the same scale as the article body copy. */}
        <span className="font-sans text-base font-normal tracking-[0.06em] uppercase">
          Return to main.
        </span>
      </button>
    </div>
  )
}

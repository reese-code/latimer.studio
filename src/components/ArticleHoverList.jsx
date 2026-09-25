import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { optimizedImageUrl } from '../lib/sanityImage'
import { triggerImageExpandTransition } from '../lib/imageExpandTransition'

// 4:3, desktop-image-sized — wider and taller than a portrait card, but
// capped as a share of the viewport so it never overruns small screens.
const PREVIEW_W = 480
const PREVIEW_H = 360
const PREVIEW_VW_RATIO = 0.34
const PREVIEW_VH_RATIO = 0.34
const EDGE_MARGIN = 16

// Keeps the fixed 4:3 aspect ratio while shrinking to fit smaller viewports
// — width-limited on most screens, height-limited on short/landscape ones.
function getPreviewSize() {
  if (typeof window === 'undefined') return { w: PREVIEW_W, h: PREVIEW_H }
  const maxW = Math.min(PREVIEW_W, window.innerWidth * PREVIEW_VW_RATIO)
  const maxH = Math.min(PREVIEW_H, window.innerHeight * PREVIEW_VH_RATIO)
  const w = Math.min(maxW, (maxH * PREVIEW_W) / PREVIEW_H)
  const h = (w * PREVIEW_H) / PREVIEW_W
  return { w, h }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// ArticleHoverList — used both as the main Info page's article index and as
// the "related articles" strip at the bottom of an article page. Each row is
// title/date with a border-bottom; hovering a row shows that article's
// preview image following the cursor, sliding up/down like a filmstrip when
// moving between rows (direction follows list order), and shrinking away
// (ease out) when the cursor leaves every row. Clicking a row expands that
// same image full-screen from the cursor as the page transition into the
// article.
// ---------------------------------------------------------------------------
export default function ArticleHoverList({ articles, heading }) {
  const navigate = useNavigate()
  const listRef = useRef(null)
  const boxRef = useRef(null)
  const layerRefs = useRef([null, null])
  const quickX = useRef(null)
  const quickY = useRef(null)
  const activeLayer = useRef(0)
  const hoveredIndexRef = useRef(null)
  const [size, setSize] = useState(getPreviewSize)
  const sizeRef = useRef(size)
  const [isTouch] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: none), (pointer: coarse)').matches
      : false
  )

  // Recompute the preview size on resize/rotate so it keeps scaling with
  // the viewport rather than staying pinned to whatever size it first
  // mounted at.
  useEffect(() => {
    if (isTouch) return
    const onResize = () => {
      const next = getPreviewSize()
      sizeRef.current = next
      setSize(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isTouch])

  // Callback ref rather than a mount effect — `articles` loads
  // asynchronously (both here and in the related-articles strip), so the box
  // often doesn't exist in the DOM yet on this component's first commit. A
  // `useEffect` keyed on mount would miss the box entirely once it appears
  // later; this fires exactly when the node itself is actually created.
  const setBoxRef = useCallback((el) => {
    boxRef.current = el
    if (!el || isTouch) return
    quickX.current = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' })
    quickY.current = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' })
  }, [isTouch])

  // Centers the preview box on the cursor (not offset to a side), clamped
  // so it never runs past the viewport edges.
  const setPreviewPosition = useCallback((clientX, clientY) => {
    if (!quickX.current || !quickY.current) return
    const { w, h } = sizeRef.current
    let x = clientX - w / 2
    let y = clientY - h / 2
    x = Math.max(EDGE_MARGIN, Math.min(x, window.innerWidth - w - EDGE_MARGIN))
    y = Math.max(EDGE_MARGIN, Math.min(y, window.innerHeight - h - EDGE_MARGIN))
    quickX.current(x)
    quickY.current(y)
  }, [])

  const movePreview = useCallback((e) => {
    setPreviewPosition(e.clientX, e.clientY)
  }, [setPreviewPosition])

  const showArticle = useCallback((article, index, enterEvent) => {
    // Seed the box's position from the row itself the moment it's entered —
    // covers the instant before the first real mousemove arrives (and any
    // synthetic/automated hover that never fires one at all) — real cursor
    // movement immediately takes over from there via movePreview.
    if (enterEvent?.currentTarget) {
      const rect = enterEvent.currentTarget.getBoundingClientRect()
      setPreviewPosition(rect.left + rect.width / 2, rect.top + rect.height / 2)
    }
    if (isTouch || !boxRef.current) return
    const prevIndex = hoveredIndexRef.current
    const frontEl = layerRefs.current[activeLayer.current]
    const backEl = layerRefs.current[1 - activeLayer.current]

    // Hovering fast enough can land a new enter mid-flight through a
    // previous switch or a hideAll shrink-out — kill whatever's still
    // animating on both image layers first, so the new animation always
    // starts from a clean, fully-defined state instead of layering on top
    // of (e.g. fading out while still sliding in). Deliberately NOT
    // killing tweens on boxRef.current itself — that's where the
    // quickTo-driven cursor-follow x/y tweens live, and killing those here
    // would freeze the box in place instead of tracking the cursor.
    gsap.killTweensOf([frontEl, backEl])

    if (prevIndex === null) {
      // Nothing hovered before — grow the box in and fade/scale the image up.
      frontEl.src = optimizedImageUrl(article.previewImage, { width: 600 })
      gsap.set(boxRef.current, { autoAlpha: 1 })
      gsap.fromTo(
        frontEl,
        { autoAlpha: 0, scale: 0.85, y: '0%' },
        { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' }
      )
    } else if (prevIndex !== index) {
      // Switching rows while still hovering the list — slide the new image
      // in from the direction matching the row's position relative to the
      // one before it, sliding the old one out the same way.
      const direction = index > prevIndex ? 1 : -1
      backEl.src = optimizedImageUrl(article.previewImage, { width: 600 })
      gsap.set(backEl, { autoAlpha: 1, scale: 1, y: `${direction * 100}%` })
      gsap.to(frontEl, {
        y: `${-direction * 100}%`,
        duration: 0.55,
        ease: 'power3.out',
      })
      gsap.to(backEl, {
        y: '0%',
        duration: 0.55,
        ease: 'power3.out',
      })
      activeLayer.current = 1 - activeLayer.current
    }
    hoveredIndexRef.current = index
  }, [isTouch])

  const hideAll = useCallback(() => {
    if (isTouch || !boxRef.current) return
    if (hoveredIndexRef.current === null) return
    hoveredIndexRef.current = null
    const frontEl = layerRefs.current[activeLayer.current]
    const backEl = layerRefs.current[1 - activeLayer.current]
    // Same as showArticle — a fast exit can land mid-switch (front layer
    // still sliding toward y:0%). Kill that first and snap it to a clean,
    // centered state so the shrink-away always reads the same regardless of
    // how it was interrupted, instead of fading out from a half-slid offset.
    // Leaves boxRef.current's own cursor-follow x/y tweens untouched.
    gsap.killTweensOf([frontEl, backEl])
    gsap.set(frontEl, { y: '0%' })
    gsap.to(frontEl, {
      autoAlpha: 0,
      scale: 0.85,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => {
        // Only actually hide the box if nothing re-hovered in the meantime —
        // a fast re-enter during this tween already started its own grow-in
        // (see showArticle), which this would otherwise stomp on.
        if (hoveredIndexRef.current === null) gsap.set(boxRef.current, { autoAlpha: 0 })
      },
    })
  }, [isTouch])

  const handleClick = useCallback((article) => {
    if (isTouch || !boxRef.current) {
      navigate(`/info/${article.id}`)
      return
    }
    const rect = boxRef.current.getBoundingClientRect()
    const frontEl = layerRefs.current[activeLayer.current]
    triggerImageExpandTransition(navigate, `/info/${article.id}`, {
      src: frontEl.src,
      rect,
    })
  }, [isTouch, navigate])

  if (!articles?.length) return null

  return (
    <section
      ref={listRef}
      onMouseMove={isTouch ? undefined : movePreview}
      onMouseLeave={isTouch ? undefined : hideAll}
      className="w-full"
    >
      {heading && (
        <div className="mb-6 flex flex-row items-center gap-2">
          <span className="text-[8px] text-maroon">★</span>
          <h2 className="m-0 font-sans text-base font-normal tracking-[0.14em] text-ink uppercase">
            {heading}
          </h2>
        </div>
      )}

      <div className="flex flex-col">
        {articles.map((article, index) => (
          <button
            key={article.id}
            type="button"
            onMouseEnter={isTouch ? undefined : (e) => showArticle(article, index, e)}
            onClick={() => handleClick(article)}
            className="group flex w-full cursor-pointer flex-row items-center justify-between gap-6 border-b border-ink/25 bg-transparent px-0 py-6 text-left transition-colors duration-200 hover:border-ink/60"
          >
            <h3 className="m-0 font-sans text-lg font-normal tracking-[0.04em] text-ink uppercase md:text-2xl">
              {article.title}
            </h3>
            <h3 className="m-0 shrink-0 font-sans text-sm font-normal tracking-[0.1em] text-ink/70 uppercase">
              {formatDate(article.date)}
            </h3>
          </button>
        ))}
      </div>

      {/* Cursor-following preview box — fixed, off-screen sized, invisible
          until the first hover. Two stacked <img> layers so switching rows
          can slide the incoming image in over the outgoing one instead of
          just swapping src. */}
      {!isTouch && (
        <div
          ref={setBoxRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: size.w,
            height: size.h,
            opacity: 0,
            visibility: 'hidden',
            overflow: 'hidden',
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          <img
            ref={(el) => (layerRefs.current[0] = el)}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0 }}
          />
          <img
            ref={(el) => (layerRefs.current[1] = el)}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0 }}
          />
        </div>
      )}
    </section>
  )
}

import { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { optimizedImageUrl } from '../lib/sanityImage'

// 4:3, desktop-image-sized — wider and taller than a portrait card, but
// capped as a share of the viewport so it never overruns small screens.
const PREVIEW_W = 480
const PREVIEW_H = 360
const PREVIEW_LAYERS = 5
const PREVIEW_VW_RATIO = 0.34
const PREVIEW_VH_RATIO = 0.34

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
  const layerRefs = useRef([])
  const zCounter = useRef(1)
  const rowRefs = useRef([])
  const [activeRow, setActiveRow] = useState(null)
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

  // The preview is centered horizontally in the viewport and vertically on
  // the hovered row, clamped so it never runs off the top/bottom.
  const setPreviewPosition = useCallback((rowEl, immediate = false) => {
    if (!quickX.current || !quickY.current || !rowEl) return
    const { w, h } = sizeRef.current
    const rect = rowEl.getBoundingClientRect()
    const y = rect.top + rect.height / 2 - h / 2
    const x = (window.innerWidth - w) / 2
    const cy = Math.max(16, Math.min(y, window.innerHeight - h - 16))
    if (immediate) {
      // Appearing: land exactly on the row, never travelling from wherever
      // the box was last.
      gsap.killTweensOf(boxRef.current, 'x,y')
      gsap.set(boxRef.current, { x, y: cy })
      // Killing the tweens above also killed the quickTo setters, so rebuild
      // them — otherwise later row-to-row moves would never glide.
      quickX.current = gsap.quickTo(boxRef.current, 'x', { duration: 0.55, ease: 'power3.out' })
      quickY.current = gsap.quickTo(boxRef.current, 'y', { duration: 0.55, ease: 'power3.out' })
      return
    }
    quickX.current(x)
    quickY.current(cy)
  }, [])

  // Keep the preview locked to its row while the page scrolls under a
  // stationary cursor.
  useEffect(() => {
    if (isTouch) return
    const onScroll = () => {
      const i = hoveredIndexRef.current
      if (i !== null) setPreviewPosition(rowRefs.current[i])
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isTouch, setPreviewPosition])

  // Warm the browser cache for every preview so a slide-in never starts
  // with an image that hasn't loaded yet (which reads as an empty or
  // partly-covered box, especially when jumping several rows at once).
  useEffect(() => {
    if (isTouch) return
    articles?.forEach((a) => {
      if (a.previewImage) new Image().src = optimizedImageUrl(a.previewImage, { width: 600 })
    })
  }, [articles, isTouch])

  const showArticle = useCallback((article, index) => {
    // Seed the box's position from the row itself the moment it's entered —
    // covers the instant before the first real mousemove arrives (and any
    // synthetic/automated hover that never fires one at all) — real cursor
    // movement immediately takes over from there via movePreview.
    setPreviewPosition(rowRefs.current[index], hoveredIndexRef.current === null)
    if (isTouch || !boxRef.current) return
    const prevIndex = hoveredIndexRef.current
    const layers = layerRefs.current
    const box = boxRef.current

    // Images are a stack: the newest sits on top of everything before it,
    // and older ones stay put underneath (never animated), so there is
    // always an image behind a slide-in and no gap can open up. Layers
    // rotate round-robin; the one reused is always the oldest, buried
    // several switches deep.
    const nextLayer = (activeLayer.current + 1) % layers.length
    const el = layers[nextLayer]
    gsap.killTweensOf(el)
    el.src = optimizedImageUrl(article.previewImage, { width: 600 })
    zCounter.current += 1
    el.style.zIndex = zCounter.current

    if (prevIndex === null) {
      // Nothing hovered before — clear any leftovers from the last hover
      // and grow the box in.
      layers.forEach((l) => {
        if (l !== el) {
          gsap.killTweensOf(l)
          gsap.set(l, { autoAlpha: 0 })
        }
      })
      gsap.set(el, { autoAlpha: 1, yPercent: 0, scale: 1 })
      gsap.killTweensOf(box, 'autoAlpha,opacity,visibility,scale')
      gsap.set(box, { scale: 1 })
      gsap.to(box, { autoAlpha: 1, duration: 0.12, ease: 'power1.out' })
      activeLayer.current = nextLayer
    } else if (prevIndex !== index) {
      // Slide the new image in over the stack from the side matching the
      // row's position relative to the previous one.
      const direction = index > prevIndex ? 1 : -1
      gsap.set(el, { autoAlpha: 1, scale: 1, yPercent: direction * 100 })
      gsap.to(el, { yPercent: 0, duration: 0.5, ease: 'power3.out' })
      activeLayer.current = nextLayer
    }
    hoveredIndexRef.current = index
    setActiveRow(index)
  }, [isTouch, setPreviewPosition])

  const hideAll = useCallback(() => {
    if (isTouch || !boxRef.current) return
    // Row highlight and image exit are driven from the same moment so the
    // row can't stay lit after the image is gone.
    setActiveRow(null)
    if (hoveredIndexRef.current === null) return
    hoveredIndexRef.current = null
    // Quick fade only — no scaling.
    const box = boxRef.current
    gsap.killTweensOf(box, 'autoAlpha,opacity,visibility,scale')
    gsap.set(box, { scale: 1 })
    gsap.to(box, { autoAlpha: 0, duration: 0.15, ease: 'power1.out' })
  }, [isTouch])

  // Touch: highlight whichever row crosses the middle band of the viewport
  // while scrolling.
  useEffect(() => {
    // Same breakpoint as the homepage services list, plus real touch devices.
    if (!isTouch && !window.matchMedia('(max-width: 767px)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveRow(Number(en.target.dataset.index))
        })
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    rowRefs.current.filter(Boolean).forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [isTouch, articles])

  const handleClick = useCallback((article) => {
    navigate(`/info/${article.id}`)
  }, [navigate])

  if (!articles?.length) return null

  return (
    <section
      ref={listRef}
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
            ref={(el) => (rowRefs.current[index] = el)}
            data-index={index}
            type="button"
            onMouseEnter={isTouch ? undefined : () => showArticle(article, index)}
            onClick={() => handleClick(article)}
            className={`flex w-full cursor-pointer flex-row items-center justify-between gap-6 border-0 border-b-2 border-solid border-ink bg-transparent px-0 py-3 text-left text-ink transition-opacity duration-250 ${
              activeRow === index ? 'opacity-100' : 'opacity-35'
            }`}
          >
            <h3 className="text-h3 m-0">{article.title}</h3>
            <span className="text-body shrink-0">{formatDate(article.date)}</span>
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
            borderRadius: 16,
            zIndex: 500,
            pointerEvents: 'none',
          }}
        >
          {Array.from({ length: PREVIEW_LAYERS }, (_, i) => (
            <img
              key={i}
              ref={(el) => (layerRefs.current[i] = el)}
              alt=""
              draggable={false}
              className="absolute inset-0 block h-full w-full bg-ink object-cover"
              style={{ opacity: 0 }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

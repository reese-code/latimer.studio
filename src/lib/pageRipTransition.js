import { gsap } from 'gsap'

// ---------------------------------------------------------------------------
// pageRipTransition — the "current page tears in half like paper and falls
// away, revealing the next page underneath" transition used for ordinary
// in-site navigation (footer/nav links, "more projects" cards, etc).
//
// How it works, at a glance:
//   1. Freeze a visual snapshot of the current page (a deep clone of the
//      #page-transition-root DOM node — any live <canvas> content is baked
//      into a plain <img> first so the clone isn't blank).
//   2. Split that snapshot into a top half and a bottom half using a
//      jagged, torn-paper clip-path at the seam.
//   3. Drop the snapshot (as an inert, pointer-events-none overlay) on top
//      of everything, then perform the *real* navigation underneath it —
//      invisible for a moment, hidden by the frozen snapshot above it.
//   4. Animate the two torn halves apart and off-screen (GSAP), revealing
//      the real new page beneath through the widening tear.
//   5. Remove the overlay once both halves are off-screen.
//
// The clone is inert, static markup — not a second live React tree — so
// there's no risk of duplicate mounts fighting over singletons (gallery
// controls, GSAP tickers, etc). It's just a picture of how the page looked
// the instant you clicked.
// ---------------------------------------------------------------------------

export const PAGE_TRANSITION_ROOT_ID = 'page-transition-root'

const TEETH = 14
const AMP = 1.8 // % of viewport height either side of the 50% seam

function buildTopClip() {
  const pts = ['0% 0%', '100% 0%']
  for (let i = TEETH; i >= 0; i--) {
    const x = (i / TEETH) * 100
    const y = 50 + (i % 2 === 0 ? AMP : -AMP)
    pts.push(`${x}% ${y}%`)
  }
  return `polygon(${pts.join(',')})`
}

function buildBottomClip() {
  const pts = []
  for (let i = 0; i <= TEETH; i++) {
    const x = (i / TEETH) * 100
    const y = 50 + (i % 2 === 0 ? AMP : -AMP)
    pts.push(`${x}% ${y}%`)
  }
  pts.push('100% 100%', '0% 100%')
  return `polygon(${pts.join(',')})`
}

const TOP_CLIP = buildTopClip()
const BOTTOM_CLIP = buildBottomClip()

// Strips ids (which would otherwise collide with the real, still-mounted
// originals) from a cloned subtree.
function stripIds(el) {
  el.removeAttribute?.('id')
  const withIds = el.querySelectorAll?.('[id]')
  withIds?.forEach((node) => node.removeAttribute('id'))
}

// Any live <canvas> in the clone is blank (cloneNode doesn't copy pixels) —
// bake each one's current frame into a same-sized <img> in its place so the
// frozen snapshot actually shows what was on screen.
function bakeCanvases(originalRoot, clonedRoot) {
  const originalCanvases = originalRoot.querySelectorAll('canvas')
  const clonedCanvases = clonedRoot.querySelectorAll('canvas')
  originalCanvases.forEach((orig, i) => {
    const cloned = clonedCanvases[i]
    if (!cloned) return
    let dataUrl
    try {
      dataUrl = orig.toDataURL()
    } catch {
      return // tainted canvas — leave it blank rather than throw
    }
    const img = document.createElement('img')
    img.src = dataUrl
    img.className = cloned.className
    img.setAttribute('style', cloned.getAttribute('style') || '')
    img.style.objectFit = 'cover'
    cloned.replaceWith(img)
  })
}

let inProgress = false

/**
 * Runs the paper-rip transition, then performs the navigation underneath it.
 * @param {(to: any, options?: any) => void} navigate - react-router navigate fn
 * @param {any} to - route to navigate to
 * @param {object} [options] - react-router navigate options
 */
export function triggerPageRip(navigate, to, options) {
  if (inProgress) {
    navigate(to, options)
    return
  }

  const root = document.getElementById(PAGE_TRANSITION_ROOT_ID)
  if (!root || typeof window === 'undefined') {
    navigate(to, options)
    return
  }

  inProgress = true

  const topClone = root.cloneNode(true)
  const bottomClone = root.cloneNode(true)
  stripIds(topClone)
  stripIds(bottomClone)
  bakeCanvases(root, topClone)
  bakeCanvases(root, bottomClone)

  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 99999;
    pointer-events: none;
    overflow: hidden;
  `

  const topHalf = document.createElement('div')
  topHalf.style.cssText = `
    position: absolute;
    inset: 0;
    overflow: hidden;
    clip-path: ${TOP_CLIP};
    will-change: transform;
    filter: drop-shadow(0 18px 26px rgba(0,0,0,0.35));
  `
  const bottomHalf = document.createElement('div')
  bottomHalf.style.cssText = `
    position: absolute;
    inset: 0;
    overflow: hidden;
    clip-path: ${BOTTOM_CLIP};
    will-change: transform;
    filter: drop-shadow(0 -18px 26px rgba(0,0,0,0.35));
  `

  topHalf.appendChild(topClone)
  bottomHalf.appendChild(bottomClone)
  overlay.appendChild(topHalf)
  overlay.appendChild(bottomHalf)
  document.body.appendChild(overlay)

  // Do the real navigation now, hidden underneath the frozen snapshot.
  navigate(to, options)

  const cleanup = () => {
    overlay.remove()
    inProgress = false
  }

  // Give the new route a couple of frames to paint before tearing the
  // snapshot apart, so there's no flash of empty page through the seam.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gsap.timeline({ onComplete: cleanup })
        .fromTo(
          topHalf,
          { y: '0%', x: '0%', rotation: 0 },
          { y: '-115%', x: '-8%', rotation: -14, duration: 0.85, ease: 'power2.in' },
          0
        )
        .fromTo(
          bottomHalf,
          { y: '0%', x: '0%', rotation: 0 },
          { y: '115%', x: '8%', rotation: 12, duration: 0.85, ease: 'power2.in' },
          0.06
        )
    })
  })
}

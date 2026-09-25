import { gsap } from 'gsap'

// ---------------------------------------------------------------------------
// triggerImageExpandTransition — the "hovered preview image grows from the
// cursor to fill the screen" page transition used going into an Info
// article. A clone of the already-loaded hover image is pinned at its
// current on-screen rect, expanded to fill the viewport, then the real
// navigation happens underneath it (hidden by the now full-bleed clone) —
// once the new page has had a couple of frames to paint, the clone fades
// out to reveal it. Mirrors the freeze → navigate → reveal shape of
// pageRipTransition.js, just with a grow-from-image effect instead of a
// paper tear.
// ---------------------------------------------------------------------------

let inProgress = false

/**
 * @param {(to: any, options?: any) => void} navigate - react-router navigate fn
 * @param {any} to - route to navigate to
 * @param {object} opts
 * @param {string} opts.src - the preview image's src (already loaded, so the
 *   expand reads as continuous rather than popping in)
 * @param {DOMRect} opts.rect - the image element's current bounding rect
 * @param {string} [opts.objectPosition] - CSS object-position to preserve framing
 */
export function triggerImageExpandTransition(navigate, to, { src, rect, objectPosition } = {}) {
  if (inProgress || !src || !rect || typeof window === 'undefined') {
    navigate(to)
    return
  }

  inProgress = true

  const overlay = document.createElement('img')
  overlay.src = src
  overlay.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    object-fit: cover;
    object-position: ${objectPosition || 'center'};
    z-index: 99999;
    pointer-events: none;
    will-change: left, top, width, height;
  `
  document.body.appendChild(overlay)

  const cleanup = () => {
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => {
        overlay.remove()
        inProgress = false
      },
    })
  }

  gsap.to(overlay, {
    left: 0,
    top: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    duration: 0.75,
    ease: 'power3.inOut',
    onComplete: () => {
      navigate(to)
      // Two frames for the new route to paint underneath the still-full-bleed
      // overlay before it fades away.
      requestAnimationFrame(() => {
        requestAnimationFrame(cleanup)
      })
    },
  })
}

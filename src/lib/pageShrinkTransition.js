import { gsap } from 'gsap'

// ---------------------------------------------------------------------------
// triggerPageShrinkTransition — the reverse of imageExpandTransition.js: used
// by the article page's back arrow. A clone of the current page is frozen in
// place and the real navigation happens immediately underneath it — so the
// next page is already there, rendered, before any animation starts — then
// the frozen clone shrinks away toward the center of the screen (not
// wherever the cursor/button happens to be) while fading out, progressively
// revealing the page beneath it instead of holding on a blank/stale frame
// until the very end.
// ---------------------------------------------------------------------------

let inProgress = false

/**
 * @param {(to: any, options?: any) => void} navigate - react-router navigate fn
 * @param {any} to - route to navigate to
 * @param {object} opts
 * @param {HTMLElement} opts.rootEl - element to snapshot and shrink away
 * @param {object} [opts.options] - react-router navigate options
 */
export function triggerPageShrinkTransition(navigate, to, { rootEl, options } = {}) {
  if (inProgress || !rootEl || typeof window === 'undefined') {
    navigate(to, options)
    return
  }

  inProgress = true

  const rect = rootEl.getBoundingClientRect()
  const clone = rootEl.cloneNode(true)
  clone.removeAttribute('id')
  clone.querySelectorAll?.('[id]').forEach((node) => node.removeAttribute('id'))

  // Screen center expressed in the overlay's own coordinate space (its
  // top-left corner is rect.left/rect.top), so the shrink always collapses
  // toward the middle of the viewport regardless of where the element
  // itself sits on the page.
  const originX = window.innerWidth / 2 - rect.left
  const originY = window.innerHeight / 2 - rect.top

  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    z-index: 99999;
    pointer-events: none;
    overflow: hidden;
    transform-origin: ${originX}px ${originY}px;
    will-change: transform, opacity;
  `
  overlay.appendChild(clone)
  document.body.appendChild(overlay)

  // Navigate now, hidden underneath the still full-size, full-opacity
  // overlay — by the time the shrink animation starts, the destination page
  // is already mounted and painted behind it.
  navigate(to, options)

  const cleanup = () => {
    overlay.remove()
    inProgress = false
  }

  // Two frames for the new route to paint underneath before shrinking the
  // overlay away, so there's no flash of it appearing mid-animation.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gsap.to(overlay, {
        scale: 0.001,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: cleanup,
      })
    })
  })
}

import { useRef, useEffect, useState } from 'react'
import useFrameLoader from '../hooks/useFrameLoader'

const TOTAL_FRAMES = 432
const CANVAS_WIDTH = 956
const CANVAS_HEIGHT = 720

function frameSrc(index) {
  const n = String(index + 1).padStart(4, '0')
  return `/frames/frame_${n}.webp`
}

// Fallback strategy: if the target frame isn't loaded yet, walk backwards
// to the nearest decoded frame. That way the user never sees a blank canvas —
// they see the most recent available frame until the new one arrives.
function nearestLoadedIndex(images, target) {
  if (!images) return -1
  // Search outward from target, alternating left/right for stability.
  const max = images.length
  for (let d = 0; d < max; d++) {
    if (target - d >= 0 && images[target - d]) return target - d
    if (target + d < max && images[target + d]) return target + d
  }
  return -1
}

export default function ScrollVideo() {
  const canvasRef = useRef(null)
  const targetFrame = useRef(0)
  const currentFrame = useRef(0)
  const lastDrawnFrame = useRef(-1)
  const rafRef = useRef(null)
  const lastEnsureTick = useRef(0)

  const loader = useFrameLoader({
    total: TOTAL_FRAMES,
    src: frameSrc,
    concurrency: 4,
    initialWindow: 24,
    lookahead: 30,
    lookbehind: 10,
    maxLiveFrames: 200,
  })

  // Track readiness separately so we can render the first frame ASAP.
  const [, force] = useState(0)
  const bump = () => force((n) => (n + 1) & 0x3fffffff)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    function drawFrame(index) {
      const images = loader.current && loader.current.images()
      if (!images) return
      const drawIdx = images[index] ? index : nearestLoadedIndex(images, index)
      if (drawIdx < 0) return
      const img = images[drawIdx]
      if (!img) return
      if (drawIdx !== index) {
        // Drawing a placeholder while waiting for target — keep lastDrawnFrame
        // set so we redraw the proper frame the moment it arrives.
        lastDrawnFrame.current = -1
      }
      if (lastDrawnFrame.current === drawIdx) return
      lastDrawnFrame.current = drawIdx
      ctx.drawImage(img, 0, 0)
    }

    function onScroll() {
      const scrollTop = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0
      targetFrame.current = Math.round(progress * (TOTAL_FRAMES - 1))
    }

    function tick() {
      const handle = loader.current
      if (handle && handle.isReady()) {
        currentFrame.current +=
          (targetFrame.current - currentFrame.current) * 0.08
        const index = Math.round(currentFrame.current)
        drawFrame(index)

        // Throttle "ensureAround" calls — only every ~120ms (~8 ticks @60fps).
        // This keeps the loader responsive without thrashing.
        const now = performance.now()
        if (now - lastEnsureTick.current > 120) {
          lastEnsureTick.current = now
          handle.ensureAround(index)
        }
      } else if (handle && handle.images()) {
        // Even before frame 0 decodes, try to draw whatever the loader has.
        const images = handle.images()
        const idx = nearestLoadedIndex(images, 0)
        if (idx >= 0 && lastDrawnFrame.current !== idx) {
          lastDrawnFrame.current = idx
          ctx.drawImage(images[idx], 0, 0)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    // Poll for "frame 0 ready" so we can clear the canvas background ASAP
    // and reveal the first frame the moment it decodes.
    let ready = false
    const readyInterval = setInterval(() => {
      const handle = loader.current
      if (handle && handle.isReady() && !ready) {
        ready = true
        canvas.style.background = 'none'
        bump()
        clearInterval(readyInterval)
      }
    }, 50)

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
      clearInterval(readyInterval)
    }
  }, [loader])

  return (
    <>
      <div style={{ height: '400vh' }} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
          background: '#000',
          willChange: 'transform',
        }}
      />
    </>
  )
}

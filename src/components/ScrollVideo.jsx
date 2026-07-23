import { useRef, useEffect, useState } from 'react'
import useFrameLoader from '../hooks/useFrameLoader'

const TOTAL_FRAMES   = 122
const LOCK_PROGRESS  = 0.60
const CANVAS_WIDTH = 1434
const CANVAS_HEIGHT = 1080

function frameSrc(index) {
  const n = String(index + 1).padStart(4, '0')
  return `/frames/scene_1/frame_${n}.webp`
}

function nearestLoadedIndex(images, target) {
  if (!images) return -1
  const max = images.length
  for (let d = 0; d < max; d++) {
    if (target - d >= 0 && images[target - d]) return target - d
    if (target + d < max && images[target + d]) return target + d
  }
  return -1
}

export default function ScrollVideo({ onProgress }) {
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

  const [, force] = useState(0)
  const bump = () => force((n) => (n + 1) & 0x3fffffff)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    function drawFit(img) {
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      const x = (canvas.width - w) / 2
      const y = (canvas.height - h) / 2
      ctx.drawImage(img, x, y, w, h)
    }

    function drawFrame(index) {
      const images = loader.current && loader.current.images()
      if (!images) return
      const drawIdx = images[index] ? index : nearestLoadedIndex(images, index)
      if (drawIdx < 0) return
      const img = images[drawIdx]
      if (!img) return
      if (drawIdx !== index) {
        lastDrawnFrame.current = -1
      }
      if (lastDrawnFrame.current === drawIdx) return
      lastDrawnFrame.current = drawIdx
      drawFit(img)
    }

    function onScroll() {
      const scrollTop = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const rawProgress = maxScroll > 0 ? scrollTop / maxScroll : 0
      // Scale so all frames finish exactly at the scroll lock point (0.60)
      const scaledProgress = Math.min(rawProgress / LOCK_PROGRESS, 1)
      targetFrame.current = Math.round(scaledProgress * (TOTAL_FRAMES - 1))
      onProgress?.(rawProgress)
    }

    function tick() {
      const handle = loader.current
      if (handle && handle.isReady()) {
        currentFrame.current +=
          (targetFrame.current - currentFrame.current) * 0.08
        const index = Math.round(currentFrame.current)
        drawFrame(index)

        const now = performance.now()
        if (now - lastEnsureTick.current > 120) {
          lastEnsureTick.current = now
          handle.ensureAround(index)
        }
      } else if (handle && handle.images()) {
        const images = handle.images()
        const idx = nearestLoadedIndex(images, 0)
        if (idx >= 0 && lastDrawnFrame.current !== idx) {
          lastDrawnFrame.current = idx
          drawFit(images[idx])
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

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
  }, [loader, onProgress])

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 block w-screen h-screen object-cover bg-black will-change-transform"
    />
  )
}

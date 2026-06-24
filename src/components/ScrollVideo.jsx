import { useRef, useEffect } from 'react'

const TOTAL_FRAMES = 432
const CANVAS_WIDTH = 956
const CANVAS_HEIGHT = 720

function frameSrc(index) {
  const n = String(index + 1).padStart(4, '0')
  return `/frames/frame_${n}.webp`
}

export default function ScrollVideo() {
  const canvasRef = useRef(null)
  const framesRef = useRef([])
  const targetFrame = useRef(0)
  const currentFrame = useRef(0)
  const lastDrawnFrame = useRef(-1)
  const loadedRef = useRef(false)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = CANVAS_WIDTH
    canvas.height = CANVAS_HEIGHT

    let loaded = 0
    const images = new Array(TOTAL_FRAMES)

    function drawFrame(index) {
      const img = images[index]
      if (!img) return
      ctx.drawImage(img, 0, 0)
    }

    function onScroll() {
      const scrollTop = window.scrollY
      const maxScroll = document.body.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0
      targetFrame.current = Math.round(progress * (TOTAL_FRAMES - 1))
    }

    function tick() {
      if (loadedRef.current) {
        currentFrame.current += (targetFrame.current - currentFrame.current) * 0.08
        const index = Math.round(currentFrame.current)
        if (index !== lastDrawnFrame.current) {
          lastDrawnFrame.current = index
          drawFrame(index)
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = frameSrc(i)
      img.onload = () => {
        loaded++
        if (loaded === TOTAL_FRAMES) {
          loadedRef.current = true
          canvas.style.background = 'none'
          drawFrame(0)
          window.addEventListener('scroll', onScroll, { passive: true })
        }
      }
      images[i] = img
    }

    framesRef.current = images
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

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

import { useRef, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// curtain_dropdown: a mostly-transparent frame sequence (alpha PNGs) used as
// the page-to-page transition — drops down to fully cover the outgoing page,
// then the route swaps underneath and it plays in reverse (last frame back
// to first) to reveal the new page.
const CURTAIN = {
  folder: '/frames/curtain_dropdown',
  total: 73,
  startIndex: 86400,
  prefix: 'curtain_dropdown_cutout',
  pad: 8,
  ext: 'png',
}

// Frames are authored at 24fps; playing at 2x gets us 48fps so the curtain
// clears quickly instead of dragging out every navigation.
const SPEED = 2

class CurtainPlayer {
  constructor({ folder, total, startIndex, prefix, pad, ext }) {
    this.folder     = folder
    this.total      = total
    this.startIndex = startIndex
    this.prefix     = prefix
    this.pad        = pad
    this.ext        = ext
    this.images     = new Array(total).fill(null)
    this._raf       = null
    this._loaded    = false
  }

  preload() {
    if (this._loaded) return
    this._loaded = true
    for (let i = 0; i < this.total; i++) {
      const img = new Image()
      const num = String(this.startIndex + i).padStart(this.pad, '0')
      img.onload = () => { this.images[i] = img }
      img.src = `${this.folder}/${this.prefix}${num}.${this.ext}`
    }
  }

  stop() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null }
  }

  drawCover(canvas, img) {
    const ctx = canvas.getContext('2d')
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight)
    const w = img.naturalWidth  * scale
    const h = img.naturalHeight * scale
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
  }

  play(canvas, forward, onDone, speed = 1) {
    this.stop()
    const frameDur = 1000 / (24 * speed)
    let frameIdx   = forward ? 0 : this.total - 1
    const step     = forward ? 1 : -1
    let lastTime   = null

    const tick = (now) => {
      if (lastTime === null) lastTime = now
      while (now - lastTime >= frameDur) {
        const img = this.images[frameIdx]
        if (!img) break // wait for the frame to arrive rather than skip it
        this.drawCover(canvas, img)
        frameIdx += step
        if (frameIdx < 0 || frameIdx >= this.total) { onDone?.(); return }
        lastTime += frameDur
      }
      this._raf = requestAnimationFrame(tick)
    }
    this._raf = requestAnimationFrame(tick)
  }
}

// Renders `children(displayLocation)` — the route tree the app should show
// right now — which lags behind the real router location until the curtain
// has finished dropping. That's what lets the swap happen fully hidden
// underneath the curtain instead of popping mid-animation.
export default function PageCurtainTransition({ children }) {
  const location = useLocation()
  const canvasRef  = useRef(null)
  const playerRef  = useRef(null)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [active, setActive] = useState(false)

  useEffect(() => {
    playerRef.current = new CurtainPlayer(CURTAIN)
    playerRef.current.preload()
  }, [])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width  = window.innerWidth
        canvas.height = window.innerHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return
    const canvas = canvasRef.current
    const player = playerRef.current
    if (!canvas || !player) {
      setDisplayLocation(location)
      return
    }

    setActive(true)
    // Curtain drops, fully covering the outgoing page...
    player.play(canvas, true, () => {
      // ...swap the page underneath while hidden...
      setDisplayLocation(location)
      window.scrollTo(0, 0)
      // ...then lift back off, reversed, revealing the new page.
      player.play(canvas, false, () => {
        setActive(false)
      }, SPEED)
    }, SPEED)
  }, [location, displayLocation])

  return (
    <>
      {children(displayLocation)}
      <canvas
        ref={canvasRef}
        className={`fixed inset-0 z-[2000] block h-screen w-screen pointer-events-none ${active ? '' : 'hidden'}`}
      />
    </>
  )
}

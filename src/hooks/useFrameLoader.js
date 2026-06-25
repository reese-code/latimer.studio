import { useEffect, useRef } from 'react'

/**
 * Adaptive frame loader for scroll-driven canvas sequences.
 *
 * Strategy:
 *  - Loads a small initial window of frames immediately so first paint is fast.
 *  - Uses a small concurrent worker pool to avoid request-queue contention.
 *  - Schedules background pre-fetching during idle time.
 *  - Exposes `ensureAround(center)` so callers can dynamically load frames
 *    around the current playhead (with lookahead / lookbehind) and evict
 *    far-away frames to keep memory bounded.
 *
 * Returns a ref whose `.current` is a small handle:
 *   - ensureAround(index)   load frames around `index`
 *   - isReady()             true once frame 0 has decoded
 *   - images()              the underlying Image[] (sparse)
 *
 * @param {object} opts
 * @param {number} opts.total            Total number of frames.
 * @param {(i:number)=>string} opts.src  Frame URL builder (0-indexed).
 * @param {number} [opts.concurrency=4]      Max concurrent image loads.
 * @param {number} [opts.initialWindow=24]   Frames to load before unlocking scroll.
 * @param {number} [opts.lookahead=24]       Pre-fetch frames ahead of playhead.
 * @param {number} [opts.lookbehind=8]       Keep this many frames behind playhead.
 * @param {number} [opts.maxLiveFrames=180]  Hard ceiling on decoded frames in memory.
 */
export default function useFrameLoader({
  total,
  src,
  concurrency = 4,
  initialWindow = 24,
  lookahead = 24,
  lookbehind = 8,
  maxLiveFrames = 180,
}) {
  const imagesRef = useRef(new Array(total))
  const pendingRef = useRef(new Set())
  const readyRef = useRef(false)
  const liveSetRef = useRef(new Set())
  const handleRef = useRef(null)
  const cancelIdleRef = useRef(null)
  // Latest src function — synced in an effect so we don't update refs
  // during render (which the React hooks lint rule forbids).
  const srcRef = useRef(src)
  useEffect(() => {
    srcRef.current = src
  }, [src])

  useEffect(() => {
    const images = imagesRef.current
    const pending = pendingRef.current
    const live = liveSetRef.current

    let cancelled = false
    let firstDecoded = false
    const queue = []

    function load(i) {
      if (cancelled) return
      if (i < 0 || i >= total) return
      if (images[i] || pending.has(i)) return

      const img = new Image()
      img.decoding = 'async'
      // Boost first-frame priority for fast first paint.
      if (i === 0 && 'fetchPriority' in img) img.fetchPriority = 'high'

      pending.add(i)
      img.onload = img.onerror = () => {
        pending.delete(i)
        images[i] = img
        live.add(i)
        if (i === 0 && !firstDecoded) {
          firstDecoded = true
          readyRef.current = true
        }
        pump()
      }
      img.src = srcRef.current(i)
    }

    function pump() {
      while (pending.size < concurrency && queue.length) {
        const next = queue.shift()
        load(next)
      }
    }

    function enqueue(indices, center) {
      for (const i of indices) {
        if (i < 0 || i >= total) continue
        if (images[i] || pending.has(i)) continue
        if (queue.includes(i)) continue
        queue.push(i)
      }
      // Closest-to-center loads first.
      queue.sort((a, b) => Math.abs(a - center) - Math.abs(b - center))
      pump()
    }

    function evictFarFrom(center) {
      if (live.size <= maxLiveFrames) return
      const sorted = [...live].sort(
        (a, b) => Math.abs(b - center) - Math.abs(a - center),
      )
      const overflow = live.size - maxLiveFrames
      for (let k = 0; k < overflow; k++) {
        const idx = sorted[k]
        // Drop the decoded image; it will be re-fetched if the user scrolls back.
        images[idx] = null
        live.delete(idx)
      }
    }

    // Initial loading window — enough to start scrolling smoothly.
    enqueue(
      Array.from({ length: initialWindow }, (_, i) => i),
      0,
    )

    handleRef.current = {
      ensureAround(center) {
        if (cancelled) return
        const lo = Math.max(0, center - lookbehind)
        const hi = Math.min(total - 1, center + lookahead)
        const indices = []
        for (let i = lo; i <= hi; i++) indices.push(i)
        enqueue(indices, center)
        evictFarFrom(center)
      },
      isReady: () => readyRef.current,
      images: () => imagesRef.current,
    }

    // Idle-time background pre-fetch of the remaining frames so the
    // user rarely sees an unloaded frame even on a fast scroll.
    const ric =
      typeof window !== 'undefined' && window.requestIdleCallback
        ? window.requestIdleCallback
        : (cb) => setTimeout(() => cb({ timeRemaining: () => 16 }), 200)

    const ricCancel =
      typeof window !== 'undefined' && window.cancelIdleCallback
        ? window.cancelIdleCallback
        : clearTimeout

    function step(deadline) {
      if (cancelled) return
      const budget =
        (deadline && deadline.timeRemaining && deadline.timeRemaining()) || 0
      const batchSize = budget > 8 ? 6 : 2
      const remaining = []
      for (let i = 0; i < total; i++) {
        if (!images[i] && !pending.has(i) && !queue.includes(i)) {
          remaining.push(i)
        }
      }
      if (remaining.length === 0) return
      enqueue(remaining.slice(0, batchSize), Math.floor(total / 2))
      cancelIdleRef.current = ric(step, { timeout: 1000 })
    }
    cancelIdleRef.current = ric(step, { timeout: 1000 })

    return () => {
      cancelled = true
      if (cancelIdleRef.current) ricCancel(cancelIdleRef.current)
      queue.length = 0
      pending.clear()
      live.clear()
      readyRef.current = false
      handleRef.current = null
    }
  }, [total, concurrency, initialWindow, lookahead, lookbehind, maxLiveFrames])

  return handleRef
}

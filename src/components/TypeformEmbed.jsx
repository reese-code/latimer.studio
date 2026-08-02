import { useEffect, useRef } from 'react'

const EMBED_SRC = '//embed.typeform.com/next/embed.js'

// Loads the Typeform embed script once (shared across mounts) and renders
// the live-form div. Typeform's script scans the DOM for
// `data-tf-live` on load, so the div just needs to be present before/when
// the script runs.
export default function TypeformEmbed({
  id = '01KZ2856FA05DPKNF3CW2YF94G',
  className = '',
  style,
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const existing = document.querySelector(`script[src="${EMBED_SRC}"]`)
    if (existing) return
    const script = document.createElement('script')
    script.src = EMBED_SRC
    script.async = true
    document.body.appendChild(script)
  }, [])

  return (
    <div ref={containerRef} className={className} style={style}>
      <div data-tf-live={id} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}


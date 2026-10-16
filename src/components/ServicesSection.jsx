import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SERVICES } from '../lib/services'

// `image` is optional — services without one show a maroon placeholder card.
function SideNote({ service, className = '' }) {
  return <span className={`text-body whitespace-nowrap font-medium ${className}`}>{service.blurb}</span>
}

export default function ServicesSection() {
  const [active, setActive] = useState(null) // hovered / scrolled-to row
  const navigate = useNavigate()
  const [cardTop, setCardTop] = useState(0)
  const rowRefs = useRef([])
  const sectionRef = useRef(null)
  const labelRefs = useRef([])

  // Mobile: size every label so the longest one just fits the screen width
  // (all rows share that size). Desktop keeps the CSS 128px.
  useLayoutEffect(() => {
    const section = sectionRef.current
    const mq = window.matchMedia('(max-width: 767px)')
    const fit = () => {
      if (!mq.matches) {
        section.style.removeProperty('--services-fs')
        return
      }
      section.style.setProperty('--services-fs', '100px')
      const widest = Math.max(...labelRefs.current.map((el) => el?.getBoundingClientRect().width || 0))
      const avail = section.clientWidth - 16
      if (widest) section.style.setProperty('--services-fs', `${Math.floor((100 * avail) / widest)}px`)
    }
    fit()
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  const current = active

  // The card never travels: it vanishes instantly, jumps to the new row, then
  // grows out on the y-axis (0.15s).
  const [cardIdx, setCardIdx] = useState(null)
  const cardOpen = current != null && cardIdx === current
  useEffect(() => {
    if (current == null) return
    const row = rowRefs.current[current]
    if (row) setCardTop(row.offsetTop + row.offsetHeight / 2)
    setCardIdx(current)
  }, [current])

  // Touch devices (no hover): whichever row crosses the middle of the screen
  // becomes the highlighted one while scrolling. Tapping still selects any row.
  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const i = Number(e.target.dataset.index)
          setActive(i)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    )
    rowRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      <div className="flex items-center gap-3 text-ink/60 md:gap-5">
        <span className="h-0.5 w-8 bg-current md:w-15" />
        <h2 className="text-body m-0 uppercase">Services</h2>
        <span className="h-0.5 flex-1 bg-current" />
      </div>

      <div
        className="relative mt-10 flex flex-col items-center gap-3 md:mb-12 md:mt-20"
        onMouseLeave={() => setActive(null)}
      >
        {/* Image card — above idle rows (covering their edges) but below the
            current row's text. Scales in/out as it moves between rows. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 z-10 max-md:hidden aspect-[5/4] w-[42vw] overflow-hidden rounded-xl bg-maroon ease-out md:left-[3%] md:w-[28.6vw] md:max-w-[416px]"
          style={{
            top: cardTop,
            // Only the entrance animates; closing (hover away / switching rows) is instant.
            transition: cardOpen ? 'transform 150ms ease-out, opacity 150ms ease-out' : 'none',
            opacity: cardOpen ? 1 : 0,
            transform: `translateY(-50%) scaleY(${cardOpen ? 1 : 0.5})`,
          }}
        >
          {SERVICES[cardIdx]?.image && (
            <img src={SERVICES[cardIdx].image} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {SERVICES.map((s, i) => {
          const isCurrent = current === i
          const dim = current != null && !isCurrent
          return (
            <div
              key={s.label}
              ref={(el) => (rowRefs.current[i] = el)}
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => navigate(`/services/${s.slug}`)}
              className="relative w-full flex cursor-pointer justify-center"
            >
              <span
                ref={(el) => (labelRefs.current[i] = el)}
                className={`relative inline-block whitespace-nowrap font-sans font-bold uppercase leading-[0.85] tracking-[-0.04em] transition-colors duration-300 ${
                  isCurrent ? 'z-20' : 'z-0'
                } ${dim ? 'text-ink/50' : 'text-ink'}`}
                style={{ fontSize: 'var(--services-fs)' }}
              >
                {s.label}
                <SideNote
                  service={s}
                  className={`absolute left-full top-1/2 ml-3 -translate-y-1/2 text-ink normal-case tracking-normal transition-opacity duration-300 max-md:hidden ${
                    isCurrent ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

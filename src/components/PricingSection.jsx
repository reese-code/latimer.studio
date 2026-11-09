import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import LetsTalkButton from './LetsTalkButton'
import { useSiteData } from '../hooks/useSiteData'
import { usePricing } from '../hooks/usePricing'

// Default duration icon; a plan can override it with an upload in Sanity.
import clockIcon from '../assets/clock.svg'

// Adds timeframes to a duration, number by number: "15 - 20 days" + "10 - 15 days"
// → "25 - 35 days". An extra can be a plain day count (5) or another duration
// text; a single number is added to every number in the base.
const nums = (x) =>
  typeof x === 'number'
    ? [x]
    : String(x || '')
        .match(/\d+/g)
        ?.map(Number) || []
const addDays = (text, extras) => {
  const list = extras.map(nums).filter((n) => n.length)
  if (!text || !list.length) return text
  let i = -1
  return text.replace(/\d+/g, (d) => {
    i++
    return Number(d) + list.reduce((sum, n) => sum + (n[i] ?? n[n.length - 1]), 0)
  })
}

const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`

// The wordmark SVGs are dark; masking them onto a white block gives the
// site's pure white without touching the files.
function WhiteSvg({ src, ratio, mobileWidth = '100%' }) {
  return (
    <span
      aria-hidden="true"
      className="block bg-white max-md:!w-[var(--mw)] max-md:!flex-none"
      style={{
        '--mw': mobileWidth,
        // Width shares the row in proportion to the ratio, so both end up the same height.
        flex: `${ratio} 1 0`,
        aspectRatio: ratio,
        WebkitMask: `url(${src}) center / contain no-repeat`,
        mask: `url(${src}) center / contain no-repeat`,
      }}
    />
  )
}

// One character. When it changes, the old one slides out the top while the
// new one slides in from the bottom (or the reverse when the price drops) —
// the same stacked-copy trick as the button label.
function Digit({ char, dir }) {
  const [state, setState] = useState({ cur: char, prev: null })
  if (state.cur !== char) setState({ cur: char, prev: state.cur })
  if (state.prev === null) return <span>{char}</span>
  return (
    <span key={char} className="relative inline-block overflow-hidden align-top">
      <span
        aria-hidden="true"
        className="absolute inset-0 block motion-reduce:hidden"
        style={{ animation: `digit-${dir}-out 300ms ease-out forwards` }}
      >
        {state.prev}
      </span>
      <span className="block" style={{ animation: `digit-${dir}-in 300ms ease-out` }}>
        {char}
      </span>
    </span>
  )
}

function Price({ value, total }) {
  const [t, setT] = useState({ total, dir: 'up' })
  if (t.total !== total) setT({ total, dir: total > t.total ? 'up' : 'down' })
  // Index from the right so a digit keeps its identity if the length changes.
  const chars = [...value].reverse()
  return <span aria-label={value}>{chars.map((c, i) => <Digit key={i} char={c} dir={t.dir} />).reverse()}</span>
}

// Switch background the plan picks in Sanity. White matches the card (#fff at 50%).
const SWITCH_THEMES = {
  black: {
    box: 'border-ink bg-ink text-cream',
    track: 'bg-cream',
    knob: 'bg-ink',
  },
  white: {
    box: 'border-[#CFCFCF] bg-white/50 text-ink',
    track: 'bg-ink',
    knob: 'bg-cream',
  },
}

function Switch({ color, label, price, on, onToggle }) {
  const theme = SWITCH_THEMES[color] || SWITCH_THEMES.black
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`flex w-full cursor-pointer rounded-xl border p-3 max-md:border-2 text-left ${theme.box}`}
    >
      <span className="text-body flex w-full items-center justify-between gap-3">
        <span className="flex items-baseline gap-3">
          {label}
          <span className="opacity-60">+{money(price)}</span>
        </span>
        <span className={`flex h-4 w-7 items-center rounded-full p-0.5 ${theme.track}`}>
          {/* Springy slide — overshoots slightly, then settles. */}
          <span
            className={`h-3 w-3 rounded-full transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.25,0.64,1)] ${theme.knob} ${
              on ? 'translate-x-3' : 'translate-x-0'
            }`}
          />
        </span>
      </span>
    </button>
  )
}

const FADE_OUT_MS = 200
const RESIZE_MS = 300

// The card shell, price card and buttons stay mounted across tabs. On a
// change the left content fades out, swaps, then fades back in while the
// shell eases to its new height; the price card just changes its text.
function Plan({ plan: target, plans }) {
  const [plan, setPlan] = useState(target)
  const [dev, setDev] = useState(false)
  const [addOnsOn, setAddOnsOn] = useState({})
  const shell = useRef(null)
  const fromHeight = useRef(null)

  useEffect(() => {
    if (target._key === plan._key) return
    const t = setTimeout(() => {
      fromHeight.current = shell.current.offsetHeight
      setDev(false)
      setAddOnsOn({})
      setPlan(target)
    }, FADE_OUT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target._key])

  // Runs right after the new content is in the DOM, before paint.
  useLayoutEffect(() => {
    const el = shell.current
    const from = fromHeight.current
    if (from === null || !el) return
    fromHeight.current = null
    el.style.transition = 'none'
    el.style.height = 'auto'
    const to = el.offsetHeight
    el.style.height = `${from}px`
    el.getBoundingClientRect() // commit the start height
    el.style.transition = `height ${RESIZE_MS}ms ease-out`
    el.style.height = `${to}px`
    const done = setTimeout(() => {
      el.style.transition = ''
      el.style.height = ''
    }, RESIZE_MS)
    return () => clearTimeout(done)
  }, [plan])

  // Faded out from the moment a new tab is picked until its content swaps in.
  const hidden = target._key !== plan._key
  // Header follows the picked tab right away; its switches start off.
  const head = hidden ? target : plan
  const devPrice = plan.developmentPrice || 0
  // A switch linked to another plan (e.g. Add Branding → the Branding tab) takes
  // that plan's price and timeframe, so the two always stay in step.
  const addOns = (plan.addOns || []).map((a) => {
    const linked =
      a.linkedPlan &&
      plans.find((p) => p._key !== plan._key && p.name?.trim().toLowerCase() === a.linkedPlan.trim().toLowerCase())
    return linked ? { ...a, price: linked.basePrice || 0, extra: linked.duration } : { ...a, extra: a.days }
  })
  const extras = hidden ? [] : [dev ? plan.developmentDays : 0, ...addOns.map((a, i) => (addOnsOn[i] ? a.extra : 0))]
  const duration = addDays(head.duration, extras)
  const total =
    (plan.basePrice || 0) +
    (dev ? devPrice : 0) +
    addOns.reduce((sum, a, i) => sum + (addOnsOn[i] ? a.price || 0 : 0), 0)

  return (
    <div
      ref={shell}
      className="grid gap-[16px] overflow-hidden rounded-2xl border border-[#CFCFCF] bg-white/50 p-3 max-md:border-2 md:grid-cols-2 md:p-4"
    >
      <div className="flex flex-col gap-[8px]">
        {/* Title and timeframe switch instantly — no fade. */}
        <div className="mb-[16px] flex items-end gap-3">
          <h3 className="text-h3 m-0 text-ink">{head.name}</h3>
          {duration && (
            <span className="text-body flex items-end gap-1.5 text-ink opacity-60">
              <img src={head.durationIcon || clockIcon} alt="" className="h-[1.5em] w-4 object-contain" />
              {duration}
            </span>
          )}
        </div>

        <div
          className="flex flex-col gap-[8px] ease-out"
          style={{
            opacity: hidden ? 0 : 1,
            filter: hidden ? 'blur(8px)' : 'blur(0)',
            transition: `opacity ${hidden ? FADE_OUT_MS : RESIZE_MS}ms, filter ${hidden ? FADE_OUT_MS : RESIZE_MS}ms`,
          }}
        >
          {devPrice > 0 && (
            <Switch
              color={plan.developmentColor}
              label={plan.developmentLabel || 'Add Development'}
              price={devPrice}
              on={dev}
              onToggle={() => setDev((v) => !v)}
            />
          )}

          {addOns.map((a, i) => (
            <Switch
              key={a._key || i}
              color={a.color}
              label={a.label}
              price={a.price}
              on={!!addOnsOn[i]}
              onToggle={() => setAddOnsOn((o) => ({ ...o, [i]: !o[i] }))}
            />
          ))}

          {plan.extras?.map((x, i) => (
            <div
              key={i}
              className="text-body flex items-center justify-between rounded-xl border border-[#CFCFCF] bg-[var(--color-bg)] p-3 text-ink max-md:border-2"
            >
              <span>{x.label}</span>
              <span>{dev && x.devPrice ? x.devPrice : x.price}</span>
            </div>
          ))}

          {plan.features?.length > 0 && (
            <ul className="m-0 mt-[16px] flex list-disc flex-col gap-3 pl-5 marker:text-black">
              {plan.features.map((f, i) => (
                <li key={i} className="text-body max-w-md text-ink">
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:self-start">
        <div className="flex aspect-[4/3] flex-col justify-between rounded-2xl border border-[#CFCFCF] bg-ink p-5 text-white max-md:border-2 md:aspect-[5/3]">
          <div className="flex w-full items-end gap-3 max-md:mb-[40px] max-md:max-w-[200px] max-md:flex-col max-md:items-start max-md:gap-2 md:gap-5">
            {/* Mobile: stacked, left-aligned, equal height — Latimer fills the width, Studio matches its height. */}
            <WhiteSvg src="/Latimer.svg" ratio={1099 / 354} />
            <WhiteSvg src="/Studio.svg" ratio={861 / 346} mobileWidth={`${((861 / 346) / (1099 / 354)) * 100}%`} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-caps m-0">
              {plan.cardLabel || plan.name || ''}
              {/* Development always sits next to the label; add-ons follow it. */}
              <Suffix on={dev} text={plan.developmentSuffix || ' + development'} />
              {addOns.map((a, i) => (
                <Suffix key={a._key || i} on={!!addOnsOn[i]} text={a.suffix || ` + ${a.label}`} />
              ))}
            </p>
            <h2 className="text-h2 m-0">
              <Price value={`+${money(total)}`} total={total} />
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LetsTalkButton
            label={plan.startLabel || 'Start Project'}
            to={plan.startHref || '/contact'}
            inverted
            className="border border-[#CFCFCF] max-md:border-2"
          />
          <MessageMenu label={plan.messageLabel || 'Send Message'} />
        </div>
      </div>
    </div>
  )
}

// "Send Message" opens a small menu to copy the email or phone number (from
// the same contactLinks the footer uses) rather than navigating away.
function MessageMenu({ label }) {
  const { siteSettings } = useSiteData()
  const links = siteSettings?.contactLinks || []
  const pick = (prefix) =>
    links.find((l) => l.href?.startsWith(prefix))?.href.slice(prefix.length).split('?')[0].trim()
  const options = [
    { key: 'email', value: pick('mailto:') },
    { key: 'phone', value: pick('tel:') },
  ].filter((o) => o.value)

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(null)
  const wrap = useRef(null)
  const timer = useRef(null)
  const panelRef = useRef(null)
  const fieldRefs = useRef([])

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const copy = async (o) => {
    try {
      await navigator.clipboard.writeText(o.value)
    } catch {
      return
    }
    setCopied(o.key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setCopied(null)
      setOpen(false)
    }, 900)
  }

  // A slight spring out of the button's corner; the backdrop blur then
  // fades in behind the panel once it has landed.
  const hasOptions = options.length > 0
  const blur = (px) => ({ backdropFilter: `blur(${px}px)`, WebkitBackdropFilter: `blur(${px}px)` })
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, { autoAlpha: 0, y: 6, scale: 0.96, transformOrigin: 'bottom left', ...blur(0) })
    gsap.set(fieldRefs.current.filter(Boolean), { opacity: 0, y: 8 })
  }, [hasOptions])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const fields = fieldRefs.current.filter(Boolean)
    gsap.killTweensOf([panel, ...fields])

    if (open) {
      gsap.to(panel, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.3)' })
      gsap.to(panel, { ...blur(24), duration: 0.35, ease: 'power1.out', delay: 0.15 })
      gsap.to(fields, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.3)', stagger: 0.05, delay: 0.08 })
    } else {
      gsap.to(fields, { opacity: 0, y: 6, duration: 0.15, ease: 'power1.in' })
      gsap.to(panel, { autoAlpha: 0, y: 6, scale: 0.96, ...blur(0), duration: 0.25, ease: 'power2.inOut', delay: 0.04 })
    }
  }, [open, hasOptions])

  // Nothing to copy (settings not loaded / none set): fall back to the form.
  if (!options.length) return <LetsTalkButton label={label} to="/contact" />

  return (
    <div ref={wrap} className="relative max-md:w-fit">
      <LetsTalkButton label={label} to={null} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} />
      <div
        ref={panelRef}
        role="menu"
        className="absolute bottom-full left-0 z-20 mb-2 min-w-64 max-md:w-full max-md:min-w-0 overflow-hidden rounded-2xl bg-white/70 p-1 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
      >
        {/* The card's #CFCFCF border as a gradient ring: full strength along the
            edges, easing to lower opacity toward the corners. Drawn by masking
            the fill down to just the padding ring. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl p-px max-md:p-0.5"
          style={{
            background:
              'radial-gradient(ellipse farthest-corner at center, #CFCFCF 0 70%, rgba(207,207,207,0.3) 100%)',
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            maskComposite: 'exclude',
          }}
        />
        <p ref={(el) => (fieldRefs.current[0] = el)} className="text-body-caps m-0 mb-1 px-2 py-1.5 text-ink/60">Click to copy</p>
        {options.map((o, i) => (
          <button
            key={o.key}
            ref={(el) => (fieldRefs.current[i + 1] = el)}
            type="button"
            role="menuitem"
            onClick={() => copy(o)}
            className="flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-xl border-none bg-transparent px-2 py-1.5 text-left transition-colors hover:bg-black/5"
          >
            <span className="text-body max-md:break-all">
              {o.value}
              {copied === o.key && " Copied"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// Grows from zero width while fading in, so whatever follows it slides over
// to make room (and slides back when it turns off).
function Suffix({ on, text }) {
  return (
    <span
      aria-hidden={!on}
      className="inline-grid align-top transition-[grid-template-columns,opacity] duration-300 ease-out"
      style={{ gridTemplateColumns: on ? '1fr' : '0fr', opacity: on ? 1 : 0 }}
    >
      <span className="min-w-0 overflow-hidden whitespace-pre">{text}</span>
    </span>
  )
}

// Filler shown until a pricing plan is added in Sanity (the Pricing tab).
const FILLER = {
  label: 'Pricing',
  title: 'You can choose between which service you want, or combine multiple',
  plans: [
    {
      _key: 'filler-landing',
      name: 'Landing page',
      duration: '15 - 20 days',
      basePrice: 2149,
      developmentLabel: 'Add Development',
      developmentPrice: 1000,
      developmentDays: 5,
      addOns: [
        {
          _key: 'filler-landing-branding',
          label: 'Add Branding',
          linkedPlan: 'Branding',
          price: 1800,
          color: 'white',
          suffix: ' + branding',
        },
      ],
      extras: [
        { label: 'Extra Pages', price: '+$500/PAGE' },
        { label: 'Animations', price: '+$300/PAGE' },
      ],
      features: Array(6).fill('This plan gets you a landing page and is great for a funnel'),
      cardLabel: 'Landing page design',
    },
    {
      _key: 'filler-branding',
      name: 'Branding',
      duration: '10 - 15 days',
      basePrice: 1800,
      extras: [{ label: 'Extra Concepts', price: '+$250/CONCEPT' }],
      features: Array(4).fill('This plan gets you a full brand identity from logo to color'),
      cardLabel: 'Branding design',
    },
  ],
}

export default function PricingSection() {
  const sanityPricing = usePricing()
  const pricing = sanityPricing?.plans?.length ? sanityPricing : FILLER
  const [activeKey, setActiveKey] = useState(null)
  const plan = pricing.plans.find((p) => p._key === activeKey) || pricing.plans[0]
  return (
    <section className="mx-auto w-full max-w-[120rem] px-2 py-10 md:px-4 md:py-20">
      <div className="flex items-center gap-3 text-ink/60 md:gap-5">
        <span className="h-0.5 w-8 bg-current md:w-15" />
        <h2 className="text-body m-0 uppercase">{pricing.label || 'Pricing'}</h2>
        <span className="h-0.5 flex-1 bg-current" />
      </div>

      {pricing.title && (
        <h3 className="text-h3 mx-auto mt-10 max-w-xl text-center text-ink md:mt-16">{pricing.title}</h3>
      )}

      <div className="mx-auto mt-8 flex max-w-[1000px] flex-col gap-4 md:mt-12">
        {pricing.plans.length > 1 && (
          <div
            role="tablist"
            className="-mx-2 flex gap-1 overflow-x-auto px-2 pb-4 [scrollbar-width:none] md:justify-center"
          >
            {pricing.plans.map((p) => {
              const selected = p._key === plan._key
              return (
                <button
                  key={p._key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveKey(p._key)}
                  className={`text-h3 shrink-0 cursor-pointer whitespace-nowrap rounded-full border-0 px-6 py-3 transition-[background-color,box-shadow,color] duration-200 md:px-8 ${
                    selected
                      ? 'bg-white text-ink shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                      : 'bg-transparent text-ink/70 hover:text-ink'
                  }`}
                >
                  {p.tabLabel || p.name}
                </button>
              )
            })}
          </div>
        )}
        <Plan plan={plan} plans={pricing.plans} />
      </div>
    </section>
  )
}

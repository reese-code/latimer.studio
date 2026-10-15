import { useState } from 'react'
import LetsTalkButton from './LetsTalkButton'

// Drop the timer icon in src/assets (any name starting with "timer", .svg).
const timerIcons = import.meta.glob('../assets/timer*.svg', { eager: true, query: '?url', import: 'default' })
const timerIcon = Object.values(timerIcons)[0]

const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`

// The wordmark SVGs are dark; masking them onto a white block gives the
// site's pure white without touching the files.
function WhiteSvg({ src, ratio }) {
  return (
    <span
      aria-hidden="true"
      className="block bg-white"
      style={{
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
  return (
    <span aria-label={value}>
      {chars
        .map((c, i) => <Digit key={i} char={c} dir={t.dir} />)
        .reverse()}
    </span>
  )
}

function Plan({ plan }) {
  const [dev, setDev] = useState(false)
  const devPrice = plan.developmentPrice || 0
  const total = (plan.basePrice || 0) + (dev ? devPrice : 0)

  return (
    <div className="grid gap-6 rounded-2xl border border-[#CFCFCF] bg-white/50 p-3 max-md:border-2 md:grid-cols-2 md:gap-5 md:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-h3 m-0 text-ink">{plan.name}</h3>
          {plan.duration && (
            <span className="text-body flex items-center gap-1.5 text-ink">
              {timerIcon && <img src={timerIcon} alt="" className="h-4 w-4" />}
              {plan.duration}
            </span>
          )}
        </div>

        {devPrice > 0 && (
          <button
            type="button"
            role="switch"
            aria-checked={dev}
            onClick={() => setDev((v) => !v)}
            className="flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-ink bg-ink p-3 max-md:border-2 text-left text-cream"
          >
            <span className="text-body flex w-full items-center justify-between">
              {plan.developmentLabel || 'Add Development'}
              <span className="flex h-4 w-7 items-center rounded-full bg-cream p-0.5">
                {/* Springy slide — overshoots slightly, then settles. */}
                <span
                  className={`h-3 w-3 rounded-full bg-ink transition-transform duration-[250ms] ease-[cubic-bezier(0.34,1.25,0.64,1)] ${
                    dev ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </span>
            </span>
            <span className="text-body">+{money(devPrice)}</span>
          </button>
        )}

        {plan.extras?.map((x, i) => (
          <div
            key={i}
            className="text-body flex items-center justify-between rounded-xl border border-[#CFCFCF] bg-[var(--color-bg)] p-3 max-md:border-2 text-ink"
          >
            <span>{x.label}</span>
            <span>{x.price}</span>
          </div>
        ))}

        {plan.features?.length > 0 && (
          <ul className="m-0 mt-2 flex list-none flex-col gap-3 p-0">
            {plan.features.map((f, i) => (
              <li key={i} className="text-body flex max-w-md items-start gap-3 text-ink">
                <span className="mt-[5px] text-[12px] text-maroon">★</span>
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-3 md:self-start">
        <div className="flex aspect-[4/3] flex-col justify-between rounded-2xl border border-[#CFCFCF] max-md:border-2 bg-ink p-5 text-white md:aspect-[5/3]">
          <div className="flex w-full items-end gap-3 md:gap-5">
            <WhiteSvg src="/Latimer.svg" ratio={1099 / 354} />
            <WhiteSvg src="/Studio.svg" ratio={861 / 346} />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-body-caps m-0">
              {plan.cardLabel || plan.name || ''}
              {/* Fades in while drifting up slightly. */}
              <span
                className={`inline-block whitespace-pre transition-all duration-300 ease-out ${
                  dev ? 'translate-y-0 opacity-100' : 'translate-y-1.5 opacity-0'
                }`}
              >
                {plan.developmentSuffix || ' + development'}
              </span>
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
          <LetsTalkButton
            label={plan.messageLabel || 'Send Message'}
            to={plan.messageHref || '/contact'}
          />
        </div>
      </div>
    </div>
  )
}

// Filler shown until a pricing plan is added in Sanity (Home → Pricing).
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
      extras: [
        { label: 'Extra Pages', price: '+$500/PAGE' },
        { label: 'Animations', price: '+$300/PAGE' },
      ],
      features: Array(6).fill('This plan gets you a landing page and is great for a funnel'),
      cardLabel: 'Landing page design',
    },
  ],
}

export default function PricingSection({ pricing: sanityPricing }) {
  const pricing = sanityPricing?.plans?.length ? sanityPricing : FILLER
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
        {pricing.plans.map((plan) => (
          <Plan key={plan._key} plan={plan} />
        ))}
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LetsTalkButton from './LetsTalkButton'

const NAV_LINKS = [
  { label: 'Contact', to: '/contact' },
  { label: 'about', to: '/about' },
  { label: 'info', to: '/info' },
  { label: 'projects', to: '/cinema' },
]

const clockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Denver',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function useDenverClock() {
  const [time, setTime] = useState(() => clockFormatter.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(clockFormatter.format(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

export default function SiteNav() {
  const time = useDenverClock()

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-3 text-ink"
      style={{ background: "var(--color-bg) url('/concrete-texture.png') repeat fixed center top" }}
    >
      <div className="flex items-center gap-1 text-body">
        {NAV_LINKS.map((link, i) => (
          <span key={link.label}>
            <Link to={link.to} className="text-inherit no-underline hover:underline">
              {link.label}
            </Link>
            {i < NAV_LINKS.length - 1 && ','}
            {i < NAV_LINKS.length - 1 && ' '}
          </span>
        ))}
      </div>

      <div className="hidden items-center gap-2 text-body sm:flex">
        <span>Denver, CO {time}</span>
        <Link to="/cinema" className="text-inherit no-underline hover:underline">
          cinema mode
        </Link>
      </div>

      <LetsTalkButton />
    </nav>
  )
}

import ticketBg from '../assets/ticket_background.png'

export default function TicketMenu() {
  const links = ['CONTACT', 'ABOUT', 'SERVICES', 'PROJECTS']

  const handleScroll = (id) => {
    const el = document.getElementById(id.toLowerCase())
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '400px',
        }}
      >
        <img
          src={ticketBg}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '32px',
            paddingTop: '70px',
          }}
        >
          {/* Latimer Studio — PPPlayground font */}
          <span
            style={{
              fontFamily: 'PPPlayground, serif',
              fontWeight: 300,
              fontSize: '72px',
              lineHeight: '16px',
              color: '#722F37',
              letterSpacing: '0px',
              userSelect: 'none',
            }}
          >
            Latimer Studio
          </span>

          {/* Nav links — OTNeueMontreal (Montreal Squeeze) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'OTNeueMontreal, sans-serif',
              fontWeight: 500,
              fontSize: '16px',
              letterSpacing: '0.08em',
              color: '#4a3a42',
              marginTop: '2px',
            }}
          >
            {links.map((link, i) => (
              <span
                key={link}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {i > 0 && (
                  <span style={{ fontSize: '8px', color: '#722F37' }}>★</span>
                )}
                <a
                  href={`#${link.toLowerCase()}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleScroll(link)
                  }}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  {link}
                </a>
              </span>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

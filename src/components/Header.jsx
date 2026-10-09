import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Scoreboard from './Scoreboard.jsx'
import { IcInstagram, BrX, BrTikTok, IcChevD } from './Brand.jsx'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/stats', label: 'Stats' },
  { to: '/news', label: 'News' },
]

const TEAM_LINKS = [
  { to: '/roster', label: 'Roster' },
  { to: '/recruits', label: 'Recruits' },
  { to: '/staff', label: 'Hockey Ops Staff' },
  // { to: '/front-office', label: 'Front Office' },
  // { to: '/volunteers', label: 'Volunteers' },
]

const MORE_LINKS = [
  { to: '/venue', label: 'Venue' },
  { href: 'https://forms.gle/iUhuvuu1Cd8nx1Cd6', label: 'Alumni' },
  { href: 'https://give.berkeley.edu/giftdetails?fund1=FU0852000', label: 'Donate' },
]

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', Icon: IcInstagram, href: 'https://www.instagram.com/calicehockey/?utm_source=ig_web_button_share_sheet&igshid=OGQ5ZDc2ODk2ZA==' },
  { key: 'x', label: 'X', Icon: BrX, href: 'https://x.com/Cal_IceHockey' },
  { key: 'tiktok', label: 'TikTok', Icon: BrTikTok, href: 'https://www.tiktok.com/@calhockey' },
]

// Reuses the site's existing free-stream link until there's a dedicated settings.watchUrl.
const WATCH_URL = 'https://www.bdehockey.com/free-live.php?con=watchCAL&type=l&desc=CAL%20Hockey%20-%20University%20of%20California%20Berkeley%20FREE'

export default function Header() {
  const location = useLocation()
  // The mobile menu. navGroup is which accordion section (Team/More) is open
  // inside it — one at a time, same as the reference, so a phone screen
  // doesn't need scrolling past two open sections to find a link.
  const [navOpen, setNavOpen] = useState(false)
  const [navGroup, setNavGroup] = useState(null)

  useEffect(() => { setNavOpen(false); setNavGroup(null) }, [location.pathname])

  // Escape closes it, and so does growing the window past the breakpoint —
  // otherwise the panel is left hanging open over a desktop layout that has
  // its own nav bar back.
  useEffect(() => {
    if (!navOpen) return
    const onKey = e => { if (e.key === 'Escape') setNavOpen(false) }
    const onResize = () => { if (window.innerWidth > 860) setNavOpen(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [navOpen])

  const closeNav = () => { setNavOpen(false); setNavGroup(null) }

  return (
    <>
      <Scoreboard />
      <header className="hdr">
        <div className="wrap navbar">
          <Link to="/" className="brand" onClick={closeNav}>
            <img src="/images/cal-ice-hockey-gold.svg" alt="Cal Ice Hockey" width="49" height="52" style={{ display: 'block' }} />
          </Link>

          <nav className="navlinks">
            {LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`navlink${location.pathname === link.to ? ' on' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="navdrop">
              <span className="navlink">Team</span>
              <ul className="navdrop-menu">
                {TEAM_LINKS.map(link => (
                  <li key={link.to}><Link to={link.to}>{link.label}</Link></li>
                ))}
              </ul>
            </div>
            <div className="navdrop">
              <span className="navlink">More</span>
              <ul className="navdrop-menu">
                {MORE_LINKS.map(link => (
                  <li key={link.to || link.href}>
                    {link.href
                      ? <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                      : <Link to={link.to}>{link.label}</Link>}
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="navactions">
            <div className="socials">
              {SOCIALS.map(({ key, label, Icon, href }) => (
                <a key={key} className="socialbtn" href={href} aria-label={label} title={label}
                  target="_blank" rel="noreferrer noopener">
                  <Icon size={17} />
                </a>
              ))}
            </div>
            <a className="goldpill navcta" href={WATCH_URL} target="_blank" rel="noreferrer noopener">
              Watch Live
            </a>

            {/* Only ever visible below the breakpoint; the links row above
                is hidden there and this replaces it. */}
            <button className={`navburger${navOpen ? ' on' : ''}`} id="navburger"
              aria-expanded={navOpen} aria-controls="mobilenav"
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen(o => !o)}>
              <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
            </button>
          </div>
        </div>

        {navOpen && (
          <nav className="navpanel" id="mobilenav" aria-label="Primary">
            {LINKS.map(link => (
              <Link key={link.to} to={link.to}
                className={`navpanelitem${location.pathname === link.to ? ' on' : ''}`}
                onClick={closeNav}>
                {link.label}
              </Link>
            ))}

            {[['team', 'Team', TEAM_LINKS], ['more', 'More', MORE_LINKS]].map(([id, label, items]) => (
              <div key={id}>
                <button className={`navpanelitem group${navGroup === id ? ' open' : ''}`}
                  aria-expanded={navGroup === id}
                  onClick={() => setNavGroup(g => (g === id ? null : id))}>
                  {label} <IcChevD size={17} />
                </button>
                {navGroup === id && (
                  <div className="navpanelsub">
                    {items.map(link => (
                      link.href ? (
                        <a key={link.href} className="navpanelitem child" href={link.href}
                          target="_blank" rel="noreferrer" onClick={closeNav}>
                          {link.label}
                        </a>
                      ) : (
                        <Link key={link.to} to={link.to}
                          className={`navpanelitem child${location.pathname === link.to ? ' on' : ''}`}
                          onClick={closeNav}>
                          {link.label}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Off the bar, but not gone — a phone header has no room for the
                pill and a visitor still wants it. */}
            <div className="navpanelcta">
              <a className="goldpill" href={WATCH_URL} target="_blank" rel="noreferrer noopener"
                onClick={closeNav}>
                Watch Live
              </a>
            </div>

            <div className="navpanelsocials">
              {SOCIALS.map(({ key, label, Icon, href }) => (
                <a key={key} className="socialbtn" href={href} aria-label={label} title={label}
                  target="_blank" rel="noreferrer noopener">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </nav>
        )}
        <div className="hdrrule" />
      </header>
    </>
  )
}

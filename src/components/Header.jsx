import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector('header')
      if (header) header.classList.toggle('sticky', window.scrollY > 0)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={menuOpen ? 'menu-open' : ''}>
      <Link to="/" className="logo" onClick={closeMenu}>
        <img src="/images/calicehockeylogo2.png" alt="California" />
      </Link>
      <button
        className="nav-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <ul className={menuOpen ? 'open' : ''}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/schedule">Schedule</Link></li>
        <li><Link to="/roster">Roster</Link></li>
        <li><Link to="/staff">Staff</Link></li>
        <li><Link to="/articles">Articles</Link></li>
        <li className="dropdown">
          <a href="/login.php">Team</a>
          <ul className="dropdown-menu">
            <li><a href="/login.php">Login</a></li>
            <li><a href="https://forms.gle/nP5RbMVFuc2RLnWz9" target="_blank" rel="noreferrer">Recruits</a></li>
            <li><a href="https://forms.gle/iUhuvuu1Cd8nx1Cd6" target="_blank" rel="noreferrer">Alumni</a></li>
          </ul>
        </li>
      </ul>
    </header>
  )
}

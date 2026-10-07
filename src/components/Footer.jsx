import { GoldenBears, Logo, Pac8Mark } from './Brand.jsx'

const AFFILIATES = [
  { src: '/images/footer-berkeley.svg', alt: 'UC Berkeley', href: 'https://www.berkeley.edu' },
  { src: '/images/footer-acha.svg', alt: 'ACHA', href: 'https://www.achahockey.org', tall: true },
  { mark: 'pac8', alt: 'Pac-8 Conference', href: 'https://www.instagram.com/pac8hockey/' },
  { src: '/images/footer-nike.svg', alt: 'Nike', href: 'https://www.nike.com', short: true },
]

const LEGAL = [
  ['/terms', 'Terms of Service'],
  ['/privacy', 'Privacy Policy'],
  ['/accessibility', 'Accessibility'],
]

export default function Footer() {
  return (
    <footer>
      <div className="fband-navy">
        <div className="wrap fpartners">
          <GoldenBears height={52} />
        </div>
      </div>

      <div className="fband-gold">
        <p className="fcopy">&copy; Cal Ice Hockey. All rights reserved.</p>
      </div>

      <div className="fband-gray">
        {AFFILIATES.map(a => {
          const mark = a.mark === 'pac8'
            ? <Pac8Mark />
            : <img className={`faffilmark${a.tall ? ' tall' : ''}${a.short ? ' short' : ''}`} src={a.src} alt={a.alt} />
          return (
            <a className="faffil" key={a.alt} href={a.href} target="_blank" rel="noreferrer noopener" aria-label={a.alt}>
              {mark}
            </a>
          )
        })}
      </div>

      <div className="wrap flegalrow">
        <div className="bsm flegallinks">
          {LEGAL.map(([k, label], i) => (
            <span key={k} className="flegalitem">
              {i > 0 && <span className="fsep" aria-hidden="true">|</span>}
              <a className="bsm flegallink" href={k}>{label}</a>
            </span>
          ))}
        </div>
        <div className="flegalmark">
          <Logo size={30} color="var(--blue)" />
          <span className="bsm">Cal Ice Hockey</span>
        </div>
      </div>
    </footer>
  )
}

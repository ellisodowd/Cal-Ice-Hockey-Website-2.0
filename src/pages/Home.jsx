import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { fetchSchedule } from '../lib/schedule.js'
import { Logo, IcArrowR } from '../components/Brand.jsx'

function NextHomeGame({ game }) {
  return (
    <section className="section" style={{ paddingTop: 24, paddingBottom: 0 }}>
      <div className="wrap hnextcontainer">
        <div className="hnext">
          <span className="hnextteams">
            <Logo size={42} color="var(--blue)" />
            <span className="hnextvs">VS</span>
            {game.logo
              ? <img className="hnextlogo" src={game.logo} alt="" onError={e => { e.currentTarget.style.display = 'none' }} />
              : <span className="hnextlogo fallback">{game.opponent.slice(0, 1)}</span>}
          </span>

          <span className="hnextinfo">
            <span className="hnextlabel">Next home game</span>
            <span className="hnextopp">vs {game.opponent}</span>
            <span className="hnextwhen">{game.datetimeText} &middot; {game.locationText}</span>
          </span>

          <span className="hnextactions">
            <a className="btn bGhostNavy bSm" href="/schedule"><IcArrowR size={15} /> Full schedule</a>
          </span>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  const announcement = true
  const [nextHome, setNextHome] = useState(null)
  const [articles, setArticles] = useState([])

  useEffect(() => {
    fetchSchedule()
      .then(games => setNextHome(games.find(g => !g.isPlayed && g.homeAway === 'H') || null))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/articles.json', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : { articles: [] }))
      .then(data => setArticles(data.articles || []))
      .catch(() => {})
  }, [])

  const hero = articles[0]
  const rail = articles.slice(1, 6)
  const cards = articles.slice(1, 4)

  return (
    <>
      <Header />

      {announcement &&
        <a
        className="heroAnnouncement"
        href="https://stores.inksoft.com/Cal_Ice_Hockey_Club_221608/shop/home"
        target="_blank"
        rel="noreferrer"
        >
        <p className="heroAnnouncement__text">
          The Official Cal Ice Hockey Merch Store is Open for a Limited Time!
        </p>
        <span className="heroAnnouncement__arrow" aria-hidden="true">
          <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12h34M27 3l9 9-9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </a>
      }

      {nextHome && <NextHomeGame game={nextHome} />}

      {hero && (
        <section className="section" style={{ paddingTop: 30, paddingBottom: 0 }}>
          <div className="wrap hherorow">
            <a className="hhero" href={hero.href}>
              <img src={hero.image} alt="" />
              <div className="hheroscrim" />
              <div className="hherotext">
                <span className="newstag">{hero.dateText}</span>
                <h1 className="hherotitle">{hero.title}</h1>
                {hero.excerpt && <p className="hheroblurb">{hero.excerpt}</p>}
              </div>
            </a>

            <div className="htopwrap">
              <aside className="htop">
                <div className="htophead">
                  <h2 className="hsectitle">Top Stories</h2>
                </div>
                {rail.length ? (
                  <ul className="htoplist">
                    {rail.map((n, i) => (
                      <li key={i}>
                        <a className="htoplink" href={n.href}>{n.title}</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="bsm" style={{ color: 'var(--muted)' }}>No other stories yet.</p>
                )}
                <a className="htopall" href="/news">All news &rarr;</a>
              </aside>
            </div>
          </div>
        </section>
      )}

      {cards.length > 0 && (
        <section className="section" style={{ paddingTop: 22, paddingBottom: 56 }}>
          <div className="wrap hcards">
            {cards.map((n, i) => (
              <a className="hcard" key={i} href={n.href}>
                <span className="hcardart">
                  <img src={n.image} alt="" />
                </span>
                <span className="hcardtitle">{n.title}</span>
                <span className="hcardmeta">{n.dateText}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  )
}

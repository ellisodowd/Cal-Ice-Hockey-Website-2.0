import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import LoadingScreen from '../components/Loading.jsx'
import { Logo, IcChevL, IcChevR } from '../components/Brand.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'
const POS_FULL = { forward: 'Forward', defense: 'Defense', goalie: 'Goaltender' }

function emptyLine() {
  return { gp: 0, g: 0, a: 0, pim: 0 }
}
function emptyGoalieLine() {
  return { gp: 0, w: 0, l: 0, t: 0, ga: 0, saves: 0, shotsAgainst: 0, so: 0 }
}

export default function PlayerBio() {
  const { name } = useParams()
  const decoded = decodeURIComponent(name)

  const [roster, setRoster] = useState([])
  const [statsSeasons, setStatsSeasons] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/roster-data.json')
      .then(res => (res.ok ? res.json() : { roster: [] }))
      .then(data => setRoster((data.roster || []).sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))))
      .catch(err => setError(err.message))

    fetch('/player-stats.json')
      .then(res => (res.ok ? res.json() : { seasons: [] }))
      .then(data => setStatsSeasons(data.seasons || []))
      .catch(() => {})
  }, [])

  const player = roster.find(p => p.name === decoded)
  const idx = roster.findIndex(p => p.name === decoded)
  const prevP = idx > 0 ? roster[idx - 1] : null
  const nextP = idx >= 0 && idx < roster.length - 1 ? roster[idx + 1] : null

  if (error || (roster.length > 0 && !player)) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}>
          <section className="section"><div className="wrap">
            <p className="blg" style={{ color: 'var(--muted)' }}>Player not found.</p>
            <Link className="backlink" to="/roster"><IcChevL size={15} /> Back to Roster</Link>
          </div></section>
        </main>
        <Footer />
      </>
    )
  }
  if (!player) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}><div className="wrap section"><LoadingScreen label="Loading player" /></div></main>
        <Footer />
      </>
    )
  }

  const isKeeper = player.position === 'goalie'

  // Every season in the backfilled feed data where this player's name shows
  // up — handles someone who's played more than one season — plus the
  // current season's line from the live roster bio.
  const seasonLines = statsSeasons
    .map(s => {
      const row = isKeeper
        ? (s.goalies || []).find(g => g.name === decoded)
        : (s.skaters || []).find(g => g.name === decoded)
      return row ? { label: s.seasonId, startYear: s.startYear, row } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.startYear - b.startYear)

  const career = isKeeper
    ? seasonLines.reduce((acc, { row }) => ({
        gp: acc.gp + row.gp, w: acc.w + row.w, l: acc.l + row.l, t: acc.t + row.t,
        ga: acc.ga + row.ga, saves: acc.saves + row.saves, shotsAgainst: acc.shotsAgainst + row.shotsAgainst,
        so: acc.so + row.so,
      }), emptyGoalieLine())
    : seasonLines.reduce((acc, { row }) => ({
        gp: acc.gp + row.gp, g: acc.g + row.g, a: acc.a + row.a, pim: acc.pim + row.pim,
      }), emptyLine())

  const mostRecent = seasonLines[seasonLines.length - 1]

  const goalieCells = row => [
    ['GP', row.gp], ['W', row.w], ['L', row.l],
    ['SV', row.saves], ['GA', row.ga],
    ['SV%', row.shotsAgainst ? (row.saves / row.shotsAgainst).toFixed(3).replace(/^0/, '') : '—'],
    ['SO', row.so],
  ]
  const skaterCells = row => [
    ['GP', row.gp], ['G', row.g], ['A', row.a], ['P', row.g + row.a], ['PIM', row.pim],
  ]

  return (
    <>
      <Header />
      <main style={{ background: 'var(--ice)' }}>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap backbar" style={{ maxWidth: 980 }}>
            <Link className="backlink" to="/roster"><IcChevL size={15} /> Back to Roster</Link>
          </div>

          <div className="wrap" style={{ maxWidth: 980 }}>
            <div className="ppsiblings" style={{ marginLeft: 0, marginBottom: 16 }}>
              {prevP && (
                <Link className="backlink" style={{ margin: 0 }} to={`/roster/${encodeURIComponent(prevP.name)}`}>
                  <IcChevL size={16} /> {prevP.number ? `#${prevP.number} ` : ''}{prevP.name.split(' ').slice(-1)[0]}
                </Link>
              )}
              {nextP && (
                <Link className="backlink" style={{ margin: 0, marginLeft: 'auto' }} to={`/roster/${encodeURIComponent(nextP.name)}`}>
                  {nextP.number ? `#${nextP.number} ` : ''}{nextP.name.split(' ').slice(-1)[0]} <IcChevR size={16} />
                </Link>
              )}
            </div>

            <div className="statcard pptop">
              <div className="pphead">
                <h1 className="ppname">{player.name}</h1>
                <span className="ppdiv" />
                <Logo size={26} color="var(--blue)" />
                {player.number && <><span className="ppdiv" /><span className="ppnum">#{player.number}</span></>}
                <span className="ppdiv" />
                <span className="pppos">{POS_FULL[player.position] || player.position}</span>
              </div>

              <div className="ppbanner" />

              <div className="ppinfo">
                <span className="ppshot">
                  <img src={`/${player.image}`} alt="" onError={e => { e.currentTarget.src = FALLBACK_IMG }} />
                </span>
                <div className="ppvitals">
                  <p><b>Height:</b> {player.height || '—'}</p>
                  <p><b>{player.handedness || 'Shoots'}:</b> {player.hand || '—'}</p>
                  <p><b>Class:</b> {player.class || '—'}</p>
                  <p><b>Hometown:</b> {player.hometown || '—'}</p>
                </div>

                <div className="ppcards">
                  {mostRecent && (
                    <div className="ppcard">
                      <span className="ppcardname">{mostRecent.label === statsSeasons[0]?.seasonId ? 'This Season' : mostRecent.startYear}</span>
                      {(isKeeper ? goalieCells(mostRecent.row) : skaterCells(mostRecent.row)).map(([k, v]) => (
                        <span className="ppcell" key={k}><span className="ppcellk">{k}</span><span className="ppcellv">{v}</span></span>
                      ))}
                    </div>
                  )}
                  {seasonLines.length > 1 && (
                    <div className="ppcard">
                      <span className="ppcardname">Career</span>
                      {(isKeeper ? goalieCells(career) : skaterCells(career)).map(([k, v]) => (
                        <span className="ppcell" key={k}><span className="ppcellk">{k}</span><span className="ppcellv">{v}</span></span>
                      ))}
                    </div>
                  )}
                  {!seasonLines.length && (
                    <p className="bsm" style={{ color: 'var(--muted)', margin: 0 }}>No game stats recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

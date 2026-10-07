import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { fetchSchedule, fetchSeasonHistory, seasonStats, currentSeasonStartYear, seasonLabel } from '../lib/schedule.js'
import { fetchGameSummary, scoringPlays, strengthTag } from '../lib/gameCenter.js'
import { IcPin, IcClock, IcChevL, IcChevR, PctRing } from '../components/Brand.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

// A real feed game id is numeric; a schedule override with no feed match
// gets a synthetic "override-..." id, which gameSummary has no row for.
const hasGameCenter = game => /^\d+$/.test(String(game.gameId))

function fullName(p) {
  return p ? `${p.firstName} ${p.lastName}`.trim() : ''
}

// Horizontally scrolling, paged strip of goal cards — pages by the strip's
// own width (cards vary in width, so there's no single card width to step
// by) and re-measures on resize.
function GoalStrip({ children }) {
  const ref = useRef(null)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)

  const measure = useCallback(() => {
    const el = ref.current
    if (!el || !el.clientWidth) return
    const step = el.clientWidth
    const total = Math.max(1, Math.ceil(el.scrollWidth / step))
    setPages(total)
    const max = el.scrollWidth - el.clientWidth
    const atEnd = max > 0 && max - el.scrollLeft <= 2
    setPage(atEnd ? total - 1 : Math.min(total - 1, Math.round(el.scrollLeft / step)))
  }, [])

  useEffect(() => {
    measure()
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, children])

  const go = i => {
    const el = ref.current
    if (!el || !el.clientWidth) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="qlstrip">
      <div className="qlgoals" ref={ref} onScroll={measure}>{children}</div>
      {pages > 1 && (
        <div className="qlpager" role="group" aria-label="Goals">
          <button className="qlarrow" aria-label="Previous" disabled={page <= 0} onClick={() => go(page - 1)}><IcChevL size={18} /></button>
          <span className="qldots">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} className={`qldot${i === page ? ' on' : ''}`} aria-label={`Page ${i + 1} of ${pages}`} onClick={() => go(i)} />
            ))}
          </span>
          <button className="qlarrow" aria-label="Next" disabled={page >= pages - 1} onClick={() => go(page + 1)}><IcChevR size={18} /></button>
        </div>
      )}
    </div>
  )
}

// "Quick look": goals only, nothing else — box score and the rest are a
// click away in the full Game Center. Fetched lazily, only once a row opens.
function QuickLook({ game }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [photoByName, setPhotoByName] = useState({})

  useEffect(() => {
    let cancelled = false
    fetchGameSummary(game.gameId)
      .then(data => { if (!cancelled) setSummary(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    fetch('/roster-data.json')
      .then(res => (res.ok ? res.json() : { roster: [] }))
      .then(data => {
        const map = {}
        for (const p of data.roster || []) map[p.name] = p.image
        if (!cancelled) setPhotoByName(map)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [game.gameId])

  if (error) return <div className="gameinfo"><p className="pboxfoot">Could not load this game.</p></div>
  if (!summary) return <div className="gameinfo"><p className="pboxfoot">Loading&hellip;</p></div>

  const plays = scoringPlays(summary)
  const final = summary.details?.status === 'Final'
  const started = summary.details?.started === '1'

  return (
    <>
      <div className="gameinfo bsm">
        <span><strong>Matchup:</strong> Cal {game.homeAway === 'A' ? 'at' : 'vs'} {game.opponent}</span>
        {summary.details?.venue && <span><strong>Venue:</strong> {summary.details.venue}</span>}
        <span><strong>Date:</strong> {game.datetimeText}</span>
        {final && <span><strong>Final:</strong> {game.usGoals}-{game.oppGoals}</span>}
      </div>

      {started && (
      <div className="pbox stack">
        <p className="pboxhead">Goals</p>
        {!plays.length ? (
          <p className="pboxfoot">No goals scored.</p>
        ) : (
          <GoalStrip>
            {plays.map((goal, i) => {
              const tag = strengthTag(goal)
              const name = fullName(goal.scoredBy)
              return (
                <div className="qlgoal" key={i}>
                  <img src={photoByName[name] || FALLBACK_IMG} alt="" onError={e => { e.currentTarget.src = FALLBACK_IMG }} />
                  <span className="qlbody">
                    <span className="qlname">
                      <span className="pboxname">{name}</span>
                      {goal.scorerGoalNumber && <span className="qlnum">({goal.scorerGoalNumber})</span>}
                      {tag && <span className="gcstrength">{tag}</span>}
                    </span>
                    <span className="qlassist">{goal.assists?.length ? goal.assists.map(fullName).join(', ') : 'Unassisted'}</span>
                    <span className="qlscore">
                      Cal {goal.usScore} - {goal.themScore}
                      <span className="qlwhen">({goal.periodLabel} &middot; {goal.time})</span>
                    </span>
                  </span>
                </div>
              )
            })}
          </GoalStrip>
        )}
      </div>
      )}
    </>
  )
}

function OppBadge({ name, logo, size = 48 }) {
  if (logo) {
    return <img src={logo} alt="" aria-hidden="true" style={{ width: size, height: size, objectFit: 'contain', flex: '0 0 auto' }}
      onError={e => { e.currentTarget.style.display = 'none' }} />
  }
  const initials = (name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span aria-hidden="true" style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--blue)', color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--body)', fontWeight: 700, fontSize: Math.round(size * 0.37), flex: '0 0 auto',
    }}>{initials}</span>
  )
}

function GameCard({ game, open, onToggle }) {
  const vs = game.homeAway === 'A' ? 'at' : game.homeAway === 'H' ? 'vs' : ''
  const sideCls = game.homeAway === 'H' ? 'home' : game.homeAway === 'A' ? 'away' : ''
  const tag = game.usGoals > game.oppGoals ? 'W' : game.usGoals < game.oppGoals ? 'L' : 'T'
  const canOpenGameCenter = hasGameCenter(game)

  return (
    <article className="gamecard">
      <div className="gamemain">
        <span style={{ position: 'relative', flex: '0 0 auto' }}>
          <OppBadge name={game.opponent} logo={game.logo} size={48} />
          {vs && (
            <span className={`vsbadge ${sideCls}`}
              style={{ position: 'absolute', right: -8, bottom: -4, width: 22, height: 22, fontSize: 10, border: '2px solid #fff' }}>
              {vs}
            </span>
          )}
        </span>

        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{game.opponent}</p>
          <p className="bsm" style={{ margin: '5px 0 0', color: 'var(--muted)' }}>
            <IcPin size={13} style={{ marginRight: 4 }} />{game.locationText}
          </p>
        </div>

        <div className="gameresult">
          {game.isPlayed && (
            <p style={{ margin: 0, fontWeight: 800, fontSize: 17, color: 'var(--blue)' }}>
              <span className={`rtag ${tag}`}>{tag}</span>, {game.usGoals} - {game.oppGoals}
            </p>
          )}
          <p className="bsm" style={{ margin: game.isPlayed ? '5px 0 0' : 0, color: 'var(--muted)', fontWeight: 600 }}>
            <strong style={{ color: 'var(--ink)' }}>{game.dateText || game.datetimeText}</strong>
            {game.timeText && <> &middot; <IcClock size={13} style={{ marginRight: 4 }} />{game.timeText}</>}
          </p>
        </div>

        {(game.watchUrl || canOpenGameCenter) && (
          <div className="gameacts">
            {game.watchUrl && <a className="watchbtn" href={game.watchUrl} target="_blank" rel="noreferrer">Watch</a>}
            {canOpenGameCenter && <Link className="watchbtn" to={`/game/${game.gameId}`}>Game Center</Link>}
          </div>
        )}
      </div>

      {canOpenGameCenter && (
        <div className="gamefoot">
          <button className="gb-link" style={{ marginLeft: 'auto' }} onClick={onToggle} aria-expanded={open}>
            Quick look {open ? '−' : '+'}
          </button>
        </div>
      )}
      {open && canOpenGameCenter && <QuickLook game={game} />}
    </article>
  )
}

export default function Schedule() {
  // Each entry: { id, label, games }. The current season stays live via
  // fetchSchedule(); past seasons come from the static backfill in
  // public/schedule-history.json (see scripts/fetch-schedule-history.mjs —
  // the ACHA feed itself doesn't go back further than 2021-22).
  const [seasons, setSeasons] = useState([])
  const [selectedId, setSelectedId] = useState('current')
  const [error, setError] = useState(null)
  // Only one game's Quick Look can be open at a time, same as the reference site.
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    let cancelled = false

    const currentLabel = seasonLabel(currentSeasonStartYear())
    Promise.all([
      fetchSchedule(),
      fetchSeasonHistory(),
    ]).then(([currentGames, history]) => {
      if (cancelled) return
      setSeasons([
        { id: 'current', label: currentLabel, games: currentGames },
        ...history.map(s => ({ id: s.seasonId, label: seasonLabel(s.startYear), games: s.games })),
      ])
    }).catch(err => {
      if (!cancelled) setError(err.message)
    })

    return () => { cancelled = true }
  }, [])

  const selected = seasons.find(s => s.id === selectedId) || seasons[0]
  const games = selected ? selected.games : []
  const s = seasonStats(games)

  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <h1 className="pagetitle">{selected ? selected.label : ''} Schedule</h1>

            {seasons.length > 1 && (
              <div className="sctrl">
                <select
                  className="rsel"
                  aria-label="Season"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>{season.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="recgrid">
              <div className="reccell"><p className="reclab">Overall</p><p className="recnum">{s.w}-{s.l}{s.t ? `-${s.t}` : ''}</p></div>
              <div className="reccell"><PctRing pct={s.pct} /></div>
              <div className="reccell"><p className="reclab">Home</p><p className="recnum">{s.home}</p></div>
              <div className="reccell"><p className="reclab">Away</p><p className="recnum">{s.away}</p></div>
              <div className="reccell"><p className="reclab">Streak</p><p className="recnum">{s.streak}</p></div>
              <div className="reccell"><p className="reclab">Goals For</p><p className="recnum">{s.gf}</p></div>
              <div className="reccell"><p className="reclab">Goals Against</p><p className="recnum">{s.ga}</p></div>
              <div className="reccell"><p className="reclab">Games</p><p className="recnum">{s.gp}</p></div>
            </div>

            {error ? (
              <p style={{ marginTop: 32 }}>Could not load schedule.</p>
            ) : (
              <div style={{ display: 'grid', gap: 18, marginTop: 32 }}>
                {games.length === 0 && <p className="blg" style={{ color: 'var(--muted)' }}>No games yet.</p>}
                {games.map(game => (
                  <GameCard key={game.gameId} game={game}
                    open={openId === game.gameId}
                    onToggle={() => setOpenId(id => (id === game.gameId ? null : game.gameId))} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

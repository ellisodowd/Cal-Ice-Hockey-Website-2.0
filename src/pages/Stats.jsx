import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { seasonLabel, seasonStats } from '../lib/schedule.js'
import { PctRing } from '../components/Brand.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

const SKATER_COLS = [
  ['number', '#', p => p.number, true],
  ['name', 'Player', p => p.name, false],
  ['position', 'Pos', p => p.position, false],
  ['gp', 'GP', p => p.gp, true],
  ['g', 'G', p => p.g, true],
  ['a', 'A', p => p.a, true],
  ['pts', 'PTS', p => p.g + p.a, true],
  ['pim', 'PIM', p => p.pim, true],
]

const GOALIE_COLS = [
  ['number', '#', g => g.number, true],
  ['name', 'Goaltender', g => g.name, false],
  ['gp', 'GP', g => g.gp, true],
  ['w', 'W', g => g.w, true],
  ['ga', 'GA', g => g.ga, true],
  ['saves', 'SV', g => g.saves, true],
  ['svpct', 'SV%', g => svpct(g), true],
  ['so', 'SO', g => g.so, true],
]

const TABS = [
  ['player', 'Player Stats'],
  ['team', 'Team Stats'],
  ['gbg', 'Game-By-Game'],
  ['hilo', 'Game High/Low'],
  ['leaders', 'Category Leaders'],
]

function svpct(g) {
  return g.shotsAgainst ? g.saves / g.shotsAgainst : 0
}

// Cal's own power play, and the other team's power play (= Cal's penalty
// kill), summed from every game that reported it. A game the scorekeeper
// left blank (null) is skipped rather than counted as zero opportunities.
function specialTeams(games) {
  const withPp = games.filter(g => g.ppOpportunities != null && g.oppPpOpportunities != null)
  if (!withPp.length) return null
  const ppg = withPp.reduce((n, g) => n + (g.ppGoals || 0), 0)
  const ppo = withPp.reduce((n, g) => n + (g.ppOpportunities || 0), 0)
  const oppPpg = withPp.reduce((n, g) => n + (g.oppPpGoals || 0), 0)
  const oppPpo = withPp.reduce((n, g) => n + (g.oppPpOpportunities || 0), 0)
  return {
    pp: ppo ? (ppg / ppo) * 100 : null, ppg, ppo,
    pk: oppPpo ? ((oppPpo - oppPpg) / oppPpo) * 100 : null, killed: oppPpo - oppPpg, pko: oppPpo, ppga: oppPpg,
    games: withPp.length, played: games.length,
  }
}

function useSortedTable(rows, cols, defaultKey, defaultDir = 'desc') {
  const [sortBy, setSortBy] = useState(defaultKey)
  const [sortDir, setSortDir] = useState(defaultDir)

  const sorted = useMemo(() => {
    const col = cols.find(c => c[0] === sortBy) || cols[0]
    const [, , get, numeric] = col
    const dir = sortDir === 'desc' ? -1 : 1
    return [...rows].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      const by = numeric ? x - y : String(x).localeCompare(String(y))
      return by * dir
    })
  }, [rows, cols, sortBy, sortDir])

  const sortByCol = key => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(key)
      setSortDir(cols.find(c => c[0] === key)?.[3] ? 'desc' : 'asc')
    }
  }

  return { sorted, sortBy, sortDir, sortByCol }
}

function StatTable({ rows, cols, format, defaultKey }) {
  const { sorted, sortBy, sortDir, sortByCol } = useSortedTable(rows, cols, defaultKey)

  return (
    <div className="twrap" style={{ border: 0 }}>
      <table className="stats sortable statstable">
        <thead>
          <tr>
            {cols.map(([key, label]) => {
              const on = sortBy === key
              return (
                <th key={key} aria-sort={on ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                  <button className={`sortbtn${on ? ' on' : ''}`} onClick={() => sortByCol(key)} title={`Sort by ${label}`}>
                    {label}
                    <span className="sortcaret" aria-hidden="true">{on ? (sortDir === 'asc' ? '▲' : '▼') : '▾'}</span>
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {cols.map(([key, , get]) => <td key={key}>{format ? format(key, get(row), row) : get(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Stats() {
  const [seasons, setSeasons] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('player')
  const [cat, setCat] = useState('skaters')
  const [photoByName, setPhotoByName] = useState({})

  useEffect(() => {
    fetch('/player-stats.json', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        const list = data.seasons || []
        setSeasons(list)
        if (list.length) setSelectedId(list[0].seasonId)
      })
      .catch(err => setError(err.message))

    // The feed has no photos — match by name against the current roster for
    // whichever players are on it. Anyone not on today's roster (graduated,
    // past seasons) just falls back to the blank silhouette.
    fetch('/roster-data.json')
      .then(res => (res.ok ? res.json() : { roster: [] }))
      .then(data => {
        const map = {}
        for (const p of data.roster || []) map[p.name] = p.image
        setPhotoByName(map)
      })
      .catch(() => {})
  }, [])

  const selected = seasons.find(s => s.seasonId === selectedId)
  const goalies = (selected?.goalies || []).filter(g => g.gp > 0)
  const games = selected?.games || []
  const record = useMemo(() => seasonStats(games.map(g => ({ ...g, isPlayed: true }))), [games])
  const st = useMemo(() => specialTeams(games), [games])

  return (
    <>
      <Header />

      <main style={{ background: '#fff', minHeight: '60vh' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <h1 className="pagetitle" style={{ flex: '1 1 auto' }}>
                {selected ? `${seasonLabel(selected.startYear)} ` : ''}Statistics
              </h1>
              {seasons.length > 1 && (
                <select className="rsel" value={selectedId || ''} onChange={e => setSelectedId(e.target.value)} aria-label="Season">
                  {seasons.map(s => <option key={s.seasonId} value={s.seasonId}>{seasonLabel(s.startYear)}</option>)}
                </select>
              )}
            </div>

            {error && (
              <div className="emptybox">
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Could not load stats.</p>
              </div>
            )}

            {!error && !seasons.length && (
              <div className="emptybox">
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Nothing here yet</p>
                <p className="bsm" style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  Stats are backfilled from the league's own feed once games are played.
                </p>
              </div>
            )}

            {selected && (
              <>
                <div className="statcard">
                  <div className="stattabs" role="tablist">
                    {TABS.map(([k, label]) => (
                      <button key={k} role="tab" aria-selected={tab === k}
                        className={`stattab${tab === k ? ' on' : ''}`} onClick={() => setTab(k)}>{label}</button>
                    ))}
                  </div>
                  {tab === 'player' && (
                    <div className="statfilter">
                      <span className="statfilterlab">Showing</span>
                      <div className="statseg" role="tablist" aria-label="Player category">
                        {[['skaters', 'Skaters'], ['goalies', 'Goaltenders']].map(([k, label]) => (
                          <button key={k} role="tab" aria-selected={cat === k}
                            className={`statsegbtn${cat === k ? ' on' : ''}`} onClick={() => setCat(k)}>{label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="statcard statbody">
                  {tab === 'player' && (
                    <>
                      <h2 className="statsec">{cat === 'goalies' ? 'Goaltenders' : 'Skaters'}</h2>
                      {cat === 'goalies' ? (
                        goalies.length
                          ? <StatTable rows={goalies} cols={GOALIE_COLS} defaultKey="saves" format={(key, value, row) => {
                              if (key === 'name') return <span className="statname"><span>{value}</span></span>
                              if (key === 'w') return `${row.w}-${row.l}${row.t ? `-${row.t}` : ''}`
                              if (key === 'svpct') return value ? value.toFixed(3).replace(/^0/, '') : '—'
                              return value
                            }} />
                          : <p className="blg" style={{ color: 'var(--muted)' }}>No goaltending minutes recorded.</p>
                      ) : (
                        <StatTable rows={selected.skaters} cols={SKATER_COLS} defaultKey="pts"
                          format={(key, value) => (key === 'name' ? <span className="statname"><span>{value}</span></span> : value)} />
                      )}
                    </>
                  )}

                  {tab === 'team' && (
                    <>
                      <h2 className="statsec">Team Stats</h2>
                      <div className="recgrid" style={{ marginTop: 8 }}>
                        <div className="reccell"><p className="reclab">Overall</p><p className="recnum">{record.w}-{record.l}{record.t ? `-${record.t}` : ''}</p></div>
                        <div className="reccell"><PctRing pct={record.pct} /></div>
                        <div className="reccell"><p className="reclab">Home</p><p className="recnum">{record.home}</p></div>
                        <div className="reccell"><p className="reclab">Away</p><p className="recnum">{record.away}</p></div>
                        <div className="reccell"><p className="reclab">Goals For</p><p className="recnum">{record.gf}</p></div>
                        <div className="reccell"><p className="reclab">Goals Against</p><p className="recnum">{record.ga}</p></div>
                        <div className="reccell"><p className="reclab">Goal Diff</p><p className="recnum">{record.gf - record.ga > 0 ? '+' : ''}{record.gf - record.ga}</p></div>
                        <div className="reccell"><p className="reclab">Streak</p><p className="recnum">{record.streak}</p></div>
                      </div>

                      {st && (
                        <>
                          <h2 className="statsec" style={{ marginTop: 34 }}>Special Teams</h2>
                          <div className="recgrid">
                            <div className="reccell">
                              <p className="reclab">Power play</p>
                              <p className="recnum">{st.pp == null ? '—' : st.pp.toFixed(1) + '%'}</p>
                              <p className="recsub">{st.ppg} for {st.ppo}</p>
                            </div>
                            <div className="reccell">
                              <p className="reclab">Penalty kill</p>
                              <p className="recnum">{st.pk == null ? '—' : st.pk.toFixed(1) + '%'}</p>
                              <p className="recsub">{st.killed} of {st.pko}</p>
                            </div>
                            <div className="reccell">
                              <p className="reclab">PP goals against</p>
                              <p className="recnum">{st.ppga}</p>
                            </div>
                          </div>
                          <p className="statnote">Special teams come from the league's own game summaries.</p>
                        </>
                      )}
                    </>
                  )}

                  {tab === 'gbg' && (
                    <>
                      <h2 className="statsec">Game-By-Game</h2>
                      <div className="twrap" style={{ border: 0 }}>
                        <table className="stats">
                          <thead><tr><th>Date</th><th>Opponent</th><th>Result</th><th>GF</th><th>GA</th>
                            <th>SH</th><th>SHA</th><th>PIM</th><th>Record</th></tr></thead>
                          <tbody>
                            {(() => {
                              let w = 0, l = 0, t = 0
                              return games.map((g, i) => {
                                const tag = g.usGoals > g.oppGoals ? 'W' : g.usGoals < g.oppGoals ? 'L' : 'T'
                                if (tag === 'W') w++
                                else if (tag === 'L') l++
                                else t++
                                return (
                                  <tr className="l5row" key={i}>
                                    <td>{g.datetimeText}</td>
                                    <td style={{ fontWeight: 600 }}>{g.homeAway === 'A' ? 'at' : 'vs'} {g.opponent}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--blue)' }}>
                                      <span className={`rtag ${tag}`}>{tag}</span>, {g.usGoals}-{g.oppGoals}
                                    </td>
                                    <td>{g.usGoals}</td><td>{g.oppGoals}</td>
                                    <td>{g.shots ?? '—'}</td><td>{g.oppShots ?? '—'}</td><td>{g.pim}</td>
                                    <td>{w}-{l}{t ? `-${t}` : ''}</td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {tab === 'hilo' && (
                    <>
                      <h2 className="statsec">Game High/Low</h2>
                      {!games.length ? <p className="blg" style={{ color: 'var(--muted)' }}>No completed games yet.</p> : (
                        <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                          {[
                            ['Most Goals Scored', [...games].sort((a, b) => b.usGoals - a.usGoals)[0], g => g.usGoals],
                            ['Largest Win Margin', [...games].sort((a, b) => (b.usGoals - b.oppGoals) - (a.usGoals - a.oppGoals))[0], g => `${g.usGoals}-${g.oppGoals}`],
                            ['Fewest Goals Allowed', [...games].sort((a, b) => a.oppGoals - b.oppGoals)[0], g => g.oppGoals],
                            ['Most Goals Allowed', [...games].sort((a, b) => b.oppGoals - a.oppGoals)[0], g => g.oppGoals],
                          ].map(([label, g, val]) => (
                            <article className="card" key={label} style={{ borderTop: '4px solid var(--gold)' }}>
                              <p className="reclab" style={{ textAlign: 'left' }}>{label}</p>
                              <p className="recnum" style={{ fontSize: 34, margin: '8px 0 4px' }}>{val(g)}</p>
                              <p className="bsm" style={{ color: 'var(--muted)', margin: 0 }}>
                                {g.homeAway === 'A' ? 'at' : 'vs'} {g.opponent} &middot; {g.datetimeText}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {tab === 'leaders' && (
                    <>
                      <h2 className="statsec">Category Leaders</h2>
                      <div className="cards" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                        {[['Goals', p => p.g], ['Assists', p => p.a], ['Points', p => p.g + p.a]].map(([label, get]) => {
                          const ranked = [...selected.skaters].map(p => ({ p, v: get(p) })).sort((a, b) => b.v - a.v).filter(x => x.v > 0).slice(0, 5)
                          return (
                            <article className="card" key={label} style={{ borderTop: '4px solid var(--gold)' }}>
                              <p className="cleadcat">{label}</p>
                              {!ranked.length && <p className="bsm" style={{ color: 'var(--muted)' }}>No stats recorded.</p>}
                              {ranked.slice(0, 1).map(({ p, v }) => (
                                <div className="cleadtop" key={p.number}>
                                  <span className="cleadphoto">
                                    <img src={photoByName[p.name] || FALLBACK_IMG} alt=""
                                      onError={e => { e.currentTarget.src = FALLBACK_IMG }} />
                                  </span>
                                  <span className="cleadtopwho">
                                    <span className="cleadtopname">{p.name}</span>
                                    <span className="cleadtopmeta">{[p.number ? `#${p.number}` : null, p.position].filter(Boolean).join(' · ')}</span>
                                  </span>
                                  <span className="cleadtopval">{v}</span>
                                </div>
                              ))}
                              {ranked.slice(1).map(({ p, v }, i) => (
                                <p className="bsm cleadrow" key={p.number}>
                                  <span className="cleadrank">{i + 2}.</span>
                                  <span className="statname" style={{ flex: 1 }}>
                                    <span className="cleadphoto-sm">
                                      <img src={photoByName[p.name] || FALLBACK_IMG} alt=""
                                        onError={e => { e.currentTarget.src = FALLBACK_IMG }} />
                                    </span>
                                    <span>{p.name}</span>
                                  </span>
                                  <span className="cleadval">{v}</span>
                                </p>
                              ))}
                            </article>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

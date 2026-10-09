import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import LoadingScreen from '../components/Loading.jsx'
import { Logo, IcGoalLight } from '../components/Brand.jsx'
import { fetchGameSummary, scoringPlays, periodsWithPlays, penaltyPlays, allPlays, strengthTag } from '../lib/gameCenter.js'
import { fetchSchedule, seasonStats, CURRENT_SEASON_ID } from '../lib/schedule.js'
import { fetchOpponentRecord, fetchOpponentSeasonTotals, fetchOpponentRoster } from '../lib/opponentSeason.js'

const THEM_GREY = '#5B6A7A'
const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

function TeamLogo({ isUs, logo, className, size, color = 'var(--blue)' }) {
  if (isUs) return <Logo size={size} color={color} />
  return logo ? <img className={className} src={logo} alt="" /> : <span className={className} style={{ width: size, height: size }} />
}

function PlayerAvatar({ photo }) {
  // /game/:gameId is a two-segment route, so a bare relative path (e.g.
  // "Headshots/x.webp") resolves against /game/ instead of / — needs the
  // leading slash that single-segment routes get away without.
  return (
    <span className="gcavatar">
      <img src={photo ? `/${photo}` : FALLBACK_IMG} alt=""
        onError={e => { e.currentTarget.src = FALLBACK_IMG }} />
    </span>
  )
}

function fullName(p) {
  return p ? `${p.firstName} ${p.lastName}`.trim() : ''
}

function GoalRow({ goal, photoByName, them }) {
  const tag = strengthTag(goal)
  const scorerName = fullName(goal.scoredBy)
  return (
    <div className="gcgoal">
      <PlayerAvatar photo={photoByName[scorerName]} />
      <span className="gcgoalwho">
        <span className="gcgoalname">
          <TeamLogo isUs={goal.isUs} logo={them.info?.logo} className="gcgoalmark" size={17} />
          {scorerName}
          {goal.scorerGoalNumber && <span className="gcgoalnum">({goal.scorerGoalNumber})</span>}
          {tag && <span className="gcstrength">{tag}</span>}
        </span>
        <span className="gcgoalassist">
          {goal.assists?.length ? goal.assists.map(fullName).join(', ') : 'Unassisted'}
        </span>
      </span>
      <span className="gcgoalcell">
        <span className="gccellval">{goal.usScore}-{goal.themScore}</span>
        <span className="gccelllab">Score</span>
      </span>
      <span className="gcgoalcell">
        <span className="gccellval">{goal.time}</span>
        <span className="gccelllab">Time</span>
      </span>
    </div>
  )
}

function BoxTable({ side, showGoalies }) {
  if (showGoalies) {
    const rows = (side.goalies || []).filter(g => g.stats?.timeOnIce && g.stats.timeOnIce !== '0:00')
    return (
      <div className="twrap">
        <table className="stats gcbt">
          <thead><tr><th>#</th><th>Goaltender</th><th>SA</th><th>SV</th><th>GA</th><th>SV%</th><th>TOI</th></tr></thead>
          <tbody>
            {rows.map((g, i) => {
              const sa = Number(g.stats.shotsAgainst) || 0
              const sv = Number(g.stats.saves) || 0
              const ga = Number(g.stats.goalsAgainst) || 0
              return (
                <tr key={i}>
                  <td>{g.info.jerseyNumber}</td>
                  <td className="gcbtname">{fullName(g.info)}</td>
                  <td>{sa}</td><td>{sv}</td><td>{ga}</td>
                  <td className="gcbtpts">{sa ? (sv / sa).toFixed(3).replace(/^0/, '') : '—'}</td>
                  <td>{g.stats.timeOnIce}</td>
                </tr>
              )
            })}
            {!rows.length && <tr><td colSpan={7} className="gcnone">No goaltending minutes recorded.</td></tr>}
          </tbody>
        </table>
      </div>
    )
  }
  const rows = side.skaters || []
  return (
    <div className="twrap">
      <table className="stats gcbt">
        <thead><tr><th>#</th><th>Player</th><th>Pos</th><th>G</th><th>A</th><th>P</th><th>S</th><th>PIM</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.info.jerseyNumber}</td>
              <td className="gcbtname">{fullName(r.info)}</td>
              <td>{r.info.position}</td>
              <td>{r.stats.goals || 0}</td><td>{r.stats.assists || 0}</td>
              <td className="gcbtpts">{(Number(r.stats.goals) || 0) + (Number(r.stats.assists) || 0)}</td>
              <td>{r.stats.shots || 0}</td><td>{r.stats.penaltyMinutes || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SeasonSeriesCard({ meetings, us, gameId }) {
  if (meetings.length < 2) return null
  let w = 0, l = 0, t = 0
  for (const g of meetings) {
    if (!g.isPlayed) continue
    if (g.usGoals > g.oppGoals) w++
    else if (g.usGoals < g.oppGoals) l++
    else t++
  }
  return (
    <div className="statcard gcpad">
      <h2 className="statsec">Season series<span className="gcserieslead">{w}-{l}{t ? `-${t}` : ''}</span></h2>
      <div className="gcseries">
        {meetings.map(g => {
          const usWon = g.isPlayed ? g.usGoals > g.oppGoals : null
          const themWon = g.isPlayed ? g.oppGoals > g.usGoals : null
          return (
            <div className={`gcmeeting${String(g.gameId) === String(gameId) ? ' on' : ''}`} key={g.gameId}>
              <div className={`gcmrow${usWon === false ? ' lost' : ''}`}>
                <span className="gcmlogo"><Logo size={20} color="var(--blue)" /></span>
                <span className="gcmteam">{us.info?.nickname}</span>
                <span className="gcmscore">{g.isPlayed ? g.usGoals : ''}</span>
              </div>
              <div className={`gcmrow${themWon === false ? ' lost' : ''}`}>
                {g.logo ? <img className="gcmlogo" src={g.logo} alt="" /> : <span className="gcmlogo" />}
                <span className="gcmteam">{g.opponent}</span>
                <span className="gcmscore">{g.isPlayed ? g.oppGoals : ''}</span>
              </div>
              <div className="gcmfoot">
                <span>{g.isPlayed ? 'Final' : (g.timeText || 'TBD')}</span>
                <span>{g.dateText}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Our own leader selection: highest value in a category, ties broken by
// points — mirrors the reference's "players to watch" pick.
function topSkater(skaters, val) {
  if (!skaters?.length) return null
  const sorted = [...skaters].sort((a, b) =>
    val(b) - val(a) || ((Number(b.g) || 0) + (Number(b.a) || 0)) - ((Number(a.g) || 0) + (Number(a.a) || 0)))
  return val(sorted[0]) > 0 ? sorted[0] : null
}

// The probable netminder: whoever clears a 25%-of-games-played floor with
// the best save percentage, falling back to whoever's played the most.
function pickGoalie(goalies) {
  if (!goalies?.length) return null
  const maxGp = Math.max(...goalies.map(g => g.gp || 0))
  if (!maxGp) return null
  const qualified = goalies.filter(g => (g.gp || 0) >= maxGp * 0.25)
  const pool = qualified.length ? qualified : goalies
  return [...pool].sort((a, b) => {
    const svA = a.shotsAgainst ? a.saves / a.shotsAgainst : 0
    const svB = b.shotsAgainst ? b.saves / b.shotsAgainst : 0
    return svB - svA || (b.gp || 0) - (a.gp || 0)
  })[0]
}

function svPct(g) {
  return g?.shotsAgainst ? (g.saves / g.shotsAgainst).toFixed(3).replace(/^0/, '') : '—'
}

function splitFirst(name) {
  const i = (name || '').lastIndexOf(' ')
  return i === -1 ? { first: '', last: name || '' } : { first: name.slice(0, i), last: name.slice(i + 1) }
}

const LEADER_CATS = [
  ['Points', s => (Number(s.g) || 0) + (Number(s.a) || 0)],
  ['Goals', s => Number(s.g) || 0],
  ['Assists', s => Number(s.a) || 0],
]

// The full pre-game page for a scheduled game: no score to show yet, so this
// replaces the Summary/Box Score/Play-By-Play tabs with the same sections the
// reference site's own game preview uses — built entirely from the public
// feed (our own season totals + the opponent's, walked the same way our
// backfill script does, just pointed at their team id) plus our own roster.
function GamePreview({ summary, meetings, seasonGames, photoByName, roster, gameId }) {
  const us = summary.us
  const them = summary.them
  const themId = them.info?.id
  const themName = (them.info?.name || '').replace(/^MD\d+\s+/, '')

  const [ourSeason, setOurSeason] = useState(null)
  const [oppRecord, setOppRecord] = useState(null)
  const [oppTotals, setOppTotals] = useState(null)
  const [oppRoster, setOppRoster] = useState(null)
  const [rosterSide, setRosterSide] = useState('us')

  useEffect(() => {
    let cancelled = false
    fetch('/player-stats.json')
      .then(res => (res.ok ? res.json() : { seasons: [] }))
      .then(data => {
        const season = (data.seasons || []).find(s => s.games?.length > 0) || null
        if (!cancelled) setOurSeason(season)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    setOppRecord(null); setOppTotals(null); setOppRoster(null)
    if (!themId) return
    fetchOpponentRecord(themId, CURRENT_SEASON_ID).then(r => { if (!cancelled) setOppRecord(r) }).catch(() => {})
    fetchOpponentSeasonTotals(themId, CURRENT_SEASON_ID).then(t => { if (!cancelled) setOppTotals(t) }).catch(() => {})
    fetchOpponentRoster(themId, CURRENT_SEASON_ID).then(r => { if (!cancelled) setOppRoster(r) }).catch(() => {})
    return () => { cancelled = true }
  }, [themId])

  const ourSkaters = ourSeason?.skaters || []
  const ourGoalies = ourSeason?.goalies || []
  const theirSkaters = oppTotals?.skaters || []
  const theirGoalies = oppTotals?.goalies || []

  const ourLeaders = LEADER_CATS.map(([label, val]) => ({ label, val, p: topSkater(ourSkaters, val) }))
  const anyOurLeader = ourLeaders.some(l => l.p)
  const ourGoalie = pickGoalie(ourGoalies)
  const theirGoalie = pickGoalie(theirGoalies)

  // Our own season record, from the same schedule the parent already fetched
  // for the Season series card — same computation Schedule.jsx's record
  // slab uses, just for the head-to-head comparison here.
  const ourRecord = useMemo(() => {
    const s = seasonStats(seasonGames)
    return { gp: s.gp, w: s.w, l: s.l, t: s.t, gf: s.gf, ga: s.ga }
  }, [seasonGames])

  const COMPARE_ROWS = oppRecord ? [
    ['Record', `${ourRecord.w}-${ourRecord.l}${ourRecord.t ? `-${ourRecord.t}` : ''}`,
      `${oppRecord.w}-${oppRecord.l}${oppRecord.t ? `-${oppRecord.t}` : ''}`, false],
    ['Games played', ourRecord.gp, oppRecord.gp, true],
    ['Goals for', ourRecord.gf, oppRecord.gf, true],
    ['Goals against', ourRecord.ga, oppRecord.ga, true],
    ['GF/GP', ourRecord.gp ? (ourRecord.gf / ourRecord.gp).toFixed(1) : '0.0', oppRecord.gp ? (oppRecord.gf / oppRecord.gp).toFixed(1) : '0.0', true],
    ['GA/GP', ourRecord.gp ? (ourRecord.ga / ourRecord.gp).toFixed(1) : '0.0', oppRecord.gp ? (oppRecord.ga / oppRecord.gp).toFixed(1) : '0.0', true],
  ] : []

  return (
    <div className="gcgrid" style={{ marginTop: 20 }}>
      <div className="gccol">
        {anyOurLeader && (
          <div className="statcard gcpad">
            <div className="gcstatshead">
              <TeamLogo isUs logo={us.info?.logo} className="gcstatslogo" size={30} />
              <h2 className="statsec" style={{ margin: 0 }}>Players to watch</h2>
              <TeamLogo logo={them.info?.logo} className="gcstatslogo" size={30} />
            </div>
            <p className="bsm gcnone gpseason">{ourSeason?.seasonName}</p>
            {ourLeaders.map(({ label, val, p }) => {
              if (!p) return null
              const theirP = topSkater(theirSkaters, val)
              const a = val(p)
              const b = theirP ? val(theirP) : null
              const total = a + (b || 0)
              const pa = total ? (a / total) * 100 : 50
              const mine = splitFirst(p.name)
              const theirs = theirP ? splitFirst(theirP.name) : null
              return (
                <div className="gcbar h2hbar" key={label}>
                  <span className="h2hpic"><PlayerAvatar photo={photoByName[p.name]} /></span>
                  <span className="h2hwho">
                    <span className="h2hname"><span className="h2hfirst">{mine.first}</span><span className="h2hlast">{mine.last}</span></span>
                    <span className="h2hpos">#{p.number || '—'} &middot; {p.position}</span>
                  </span>
                  <span className="h2hnum">{a}</span>
                  <span className="gcbarlab">{label}</span>
                  <span className="h2hnum right">{b == null ? '—' : b}</span>
                  <span className="h2hpic right"><TeamLogo logo={them.info?.logo} className="h2hmark" size={38} /></span>
                  <span className={`h2hwho right${theirP ? '' : ' unknown'}`}>
                    <span className="h2hname"><span className="h2hfirst">{theirs?.first || ''}</span><span className="h2hlast">{theirs?.last || (oppTotals ? 'Not published' : 'Loading…')}</span></span>
                    <span className="h2hpos">{theirP ? `#${theirP.number || '—'} · ${theirP.position || ''}` : themName}</span>
                  </span>
                  <span className="gcbartrack">
                    {b == null ? <span className="gcbarnone" /> : (
                      <>
                        <span className="gcbarfill left" style={{ width: `${pa}%`, background: 'var(--blue)' }} />
                        <span className="gcbarfill right" style={{ width: `${100 - pa}%`, background: THEM_GREY }} />
                      </>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="statcard gcpad">
          <h2 className="statsec">Goaltending<span className="gcserieslead">{ourSeason?.seasonName}</span></h2>
          {[
            { key: 'us', abbr: us.info?.nickname, isUs: true, logo: null, goalie: ourGoalie, loading: !ourSeason },
            { key: 'them', abbr: them.info?.nickname, isUs: false, logo: them.info?.logo, goalie: theirGoalie, loading: !oppTotals },
          ].map(side => (
            <div className="gtblock" key={side.key}>
              <div className="gtband">
                <span className="gtbandmark">
                  <TeamLogo isUs={side.isUs} logo={side.logo} className="gclinelogo" size={26} />
                  <span className="gtbandname">{side.abbr}</span>
                </span>
              </div>
              {side.goalie ? (() => {
                const name = splitFirst(side.goalie.name)
                return (
                  <div className="gtrow">
                    <span className="gtwho">
                      {side.isUs
                        ? <PlayerAvatar photo={photoByName[side.goalie.name]} />
                        : <TeamLogo logo={side.logo} className="gtmark" size={44} />}
                      <span className="gtnames">
                        <span className="gtfirst">{name.first}</span>
                        <span className="gtlast">{name.last}</span>
                        <span className="gtnum">{side.goalie.number ? `#${side.goalie.number}` : ''}</span>
                      </span>
                    </span>
                    <span className="gtstat"><strong>{side.goalie.gp}</strong><span className="gtstatlab">GP</span></span>
                    <span className="gtstat"><strong>{side.goalie.gp ? (side.goalie.ga / side.goalie.gp).toFixed(1) : '—'}</strong><span className="gtstatlab">GA/GP</span></span>
                    <span className="gtstat"><strong>{svPct(side.goalie)}</strong><span className="gtstatlab">SV%</span></span>
                    <span className="gtstat"><strong>{side.goalie.so || 0}</strong><span className="gtstatlab">SO</span></span>
                  </div>
                )
              })() : (
                <p className="bsm gcnone" style={{ padding: '10px 2px' }}>{side.loading ? 'Loading…' : 'No goaltending on file.'}</p>
              )}
            </div>
          ))}
        </div>

        <div className="statcard gcpad gcroster">
          <h2 className="statsec">Roster</h2>
          <div className="tabs" style={{ marginBottom: 14 }}>
            <button className={`tab${rosterSide === 'us' ? ' on' : ''}`} onClick={() => setRosterSide('us')}>{us.info?.nickname}</button>
            <button className={`tab${rosterSide === 'them' ? ' on' : ''}`} onClick={() => setRosterSide('them')}>{themName}</button>
          </div>
          {rosterSide === 'us' ? (
            roster.length ? (
              <div className="twrap bare">
                <table className="stats gcbt">
                  <thead><tr><th>#</th><th>Player</th><th>Pos</th><th>GP</th><th>G</th><th>A</th><th>P</th><th>PIM</th></tr></thead>
                  <tbody>
                    {roster.map(p => {
                      const isGoalie = p.position === 'goalie'
                      const t = isGoalie ? ourGoalies.find(g => g.name === p.name) : ourSkaters.find(s => s.name === p.name)
                      return (
                        <tr key={p.name}>
                          <td>{p.number}</td>
                          <td className="gcbtname">{p.name}</td>
                          <td className="gcbtspot">{p.position}</td>
                          <td>{t ? t.gp : '—'}</td>
                          <td>{t && !isGoalie ? t.g : '—'}</td>
                          <td>{t && !isGoalie ? t.a : '—'}</td>
                          <td className="gcbtpts">{t && !isGoalie ? (Number(t.g) || 0) + (Number(t.a) || 0) : '—'}</td>
                          <td>{t && !isGoalie ? t.pim : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="bsm gcnone">No roster on file.</p>
          ) : (
            oppRoster?.length ? (
              <div className="twrap bare">
                <table className="stats gcbt">
                  <thead><tr><th>#</th><th>Player</th><th>Pos</th></tr></thead>
                  <tbody>
                    {oppRoster.map((p, i) => (
                      <tr key={i}><td>{p.tp_jersey_number}</td><td className="gcbtname">{p.name}</td><td className="gcbtspot">{p.position}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="bsm gcnone">{oppRoster === null ? 'Loading…' : 'No roster published.'}</p>
          )}
        </div>
      </div>

      <div className="gccol">
        {!!oppRecord && (
          <div className="statcard gcpad">
            <div className="gcstatshead">
              <TeamLogo isUs logo={us.info?.logo} className="gcstatslogo" size={30} />
              <h2 className="statsec" style={{ margin: 0 }}>Head to head</h2>
              <TeamLogo logo={them.info?.logo} className="gcstatslogo" size={30} />
            </div>
            {COMPARE_ROWS.map(([label, a, b, bar]) => {
              const x = Number(a), y = Number(b)
              const total = (Number.isFinite(x) ? x : 0) + (Number.isFinite(y) ? y : 0)
              const pa = total ? (x / total) * 100 : 50
              return (
                <div className={`gcbar${bar ? '' : ' norail'}`} key={label}>
                  <span className="gcbarval">{a}</span>
                  <span className="gcbarlab">{label}</span>
                  <span className="gcbarval right">{b}</span>
                  {bar && Number.isFinite(x) && Number.isFinite(y) && (
                    <span className="gcbartrack">
                      <span className="gcbarfill left" style={{ width: `${pa}%`, background: 'var(--blue)' }} />
                      <span className="gcbarfill right" style={{ width: `${100 - pa}%`, background: THEM_GREY }} />
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <SeasonSeriesCard meetings={meetings} us={us} gameId={gameId} />

        <div className="statcard gcpad">
          <h2 className="statsec">Game info</h2>
          <dl className="gcinfo">
            <dt>Matchup</dt><dd>California {summary.usIsHome ? 'vs' : 'at'} {themName}</dd>
            {summary.details?.venue && <><dt>Venue</dt><dd>{summary.details.venue}</dd></>}
            <dt>Date</dt>
            <dd>{summary.details?.date}{summary.details?.status ? ` · ${summary.details.status}` : ''}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default function GameCenter() {
  const { gameId } = useParams()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('summary')
  const [side, setSide] = useState('us')
  const [boxMode, setBoxMode] = useState('skaters')
  const [photoByName, setPhotoByName] = useState({})
  const [roster, setRoster] = useState([])
  const [seasonGames, setSeasonGames] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchGameSummary(gameId)
      .then(data => { if (!cancelled) setSummary(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    fetch('/roster-data.json')
      .then(res => (res.ok ? res.json() : { roster: [] }))
      .then(data => {
        const map = {}
        for (const p of data.roster || []) map[p.name] = p.image
        if (!cancelled) { setPhotoByName(map); setRoster(data.roster || []) }
      })
      .catch(() => {})
    fetchSchedule()
      .then(games => { if (!cancelled) setSeasonGames(games) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [gameId])

  const plays = useMemo(() => (summary ? scoringPlays(summary) : []), [summary])
  const penalties = useMemo(() => (summary ? penaltyPlays(summary) : []), [summary])
  const pbpAllPlays = useMemo(() => (summary ? allPlays(summary) : []), [summary])
  const byPeriod = useMemo(() => periodsWithPlays(plays), [plays])
  const [pbpPeriod, setPbpPeriod] = useState('')
  const [pbpTeam, setPbpTeam] = useState('')

  // Current-season meetings against this same opponent, matched by team id
  // (not name) since the feed's own name casing/prefix varies by view.
  const meetings = useMemo(() => {
    const themId = summary?.them?.info?.id
    if (!themId) return []
    return seasonGames
      .filter(g => Number(g.opponentTeamId) === Number(themId))
      .sort((a, b) => a.sortDate - b.sortDate)
  }, [seasonGames, summary?.them?.info?.id])

  if (error) {
    return (
      <>
        <Header />
        <main style={{ background: 'var(--page)' }}><div className="wrap section"><p className="blg" style={{ color: 'var(--muted)' }}>Could not load this game.</p></div></main>
        <Footer />
      </>
    )
  }
  if (!summary) {
    return (
      <>
        <Header />
        <main style={{ background: 'var(--page)' }}><div className="wrap section"><LoadingScreen label="Loading game" /></div></main>
        <Footer />
      </>
    )
  }

  const us = summary.us
  const them = summary.them
  const usScore = Number(us.stats?.goals) || 0
  const themScore = Number(them.stats?.goals) || 0
  const final = summary.details?.status === 'Final'
  const started = summary.details?.started === '1'

  return (
    <>
      <Header />
      <main style={{ background: 'var(--page)' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <div className="gchead">
              <h1 className="gctitle">Game Center</h1>
            </div>

            <div className="gcbanner">
              <span className="gcslash left" />
              <span className="gcslash right" style={{ background: THEM_GREY }} />
              <div className="gcbannerinner">
                <div className="gcteam left">
                  <div className="gcid">
                    <TeamLogo isUs className="gclogo" size={46} />
                    <div className="gcnames">
                      <span className="gcabbr">{us.info?.nickname}</span>
                      <span className="gcname">{(us.info?.name || '').replace(/^MD\d+\s+/, '')}</span>
                      <span className="gcsog">SOG: {us.stats?.shots ?? 0}</span>
                    </div>
                  </div>
                  <span className={`gcscore${usScore < themScore ? ' beaten' : ''}`}>{started ? usScore : '—'}</span>
                </div>

                <div className="gcmid">
                  <span className="gcchip">{final ? 'FINAL' : summary.details?.status}</span>
                  <span className="gcwhen">{summary.details?.date}</span>
                </div>

                <div className="gcteam right">
                  <span className={`gcscore${themScore < usScore ? ' beaten' : ''}`}>{started ? themScore : '—'}</span>
                  <div className="gcid">
                    <TeamLogo logo={them.info?.logo} className="gclogo" size={46} />
                    <div className="gcnames">
                      <span className="gcabbr">{them.info?.nickname}</span>
                      <span className="gcname">{(them.info?.name || '').replace(/^MD\d+\s+/, '')}</span>
                      <span className="gcsog">SOG: {them.stats?.shots ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!started && (
              <GamePreview summary={summary} meetings={meetings} seasonGames={seasonGames}
                photoByName={photoByName} roster={roster} gameId={gameId} />
            )}

            {started && (
            <div className="gctabs" role="tablist">
              <button role="tab" aria-selected={tab === 'summary'} className={`gctab${tab === 'summary' ? ' on' : ''}`} onClick={() => setTab('summary')}>Summary</button>
              <button role="tab" aria-selected={tab === 'box'} className={`gctab${tab === 'box' ? ' on' : ''}`} onClick={() => setTab('box')}>Box Score</button>
              <button role="tab" aria-selected={tab === 'pbp'} className={`gctab${tab === 'pbp' ? ' on' : ''}`} onClick={() => setTab('pbp')}>Play-By-Play</button>
            </div>
            )}

            {started && tab === 'summary' && (
              <div className="gcgrid">
                <div className="gccol">
                  <div className="statcard gcpad">
                    <h2 className="statsec">Scoring</h2>
                    {!byPeriod.length && <p className="gcnone">No goals scored.</p>}
                    {byPeriod.map(group => (
                      <div className="gcperiod" key={group.periodId}>
                        <p className="gcperiodlab">
                          {/^(ot|overtime|so|shootout)/i.test(group.label || '') ? group.label : `${group.label} Period`}
                        </p>
                        {group.plays.map((goal, i) => <GoalRow key={i} goal={goal} photoByName={photoByName} them={them} />)}
                      </div>
                    ))}
                  </div>

                  <div className="statcard gcpad">
                    <h2 className="statsec">Penalties</h2>
                    {!penalties.length && <p className="gcnone">No penalties recorded.</p>}
                    {!!penalties.length && (
                      <div className="twrap">
                        <table className="stats gcpen">
                          <thead><tr><th>Period</th><th>Time</th><th>Team</th><th>Player</th><th>Infraction</th><th>Min</th></tr></thead>
                          <tbody>
                            {penalties.map((p, i) => (
                              <tr key={i}>
                                <td>{p.periodLabel}</td>
                                <td>{p.time}</td>
                                <td>{p.isUs ? us.info?.nickname : them.info?.nickname}</td>
                                <td className="gcbtname">{fullName(p.takenBy) || fullName(p.servedBy)}</td>
                                <td>{p.description}</td>
                                <td>{p.minutes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="gccol">
                  <div className="statcard gcpad">
                    <h2 className="statsec">Linescore</h2>
                    <div className="twrap">
                      <table className="stats gcline">
                        <thead>
                          <tr><th>Team</th>{(summary.periods || []).map((p, i) => <th key={i}>{p.info?.shortName || p.info?.longName}</th>)}<th>Final</th></tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <span className="gclineteam">
                                <TeamLogo isUs logo={us.info?.logo} className="gclinelogo" size={18} />
                                {us.info?.nickname}
                              </span>
                            </td>
                            {(summary.periods || []).map((p, i) => <td key={i}>{p.stats?.homeGoals != null && summary.usIsHome ? p.stats.homeGoals : p.stats?.visitingGoals}</td>)}
                            <td style={{ fontWeight: 800 }}>{usScore}</td>
                          </tr>
                          <tr>
                            <td>
                              <span className="gclineteam">
                                <TeamLogo logo={them.info?.logo} className="gclinelogo" size={18} />
                                {them.info?.nickname}
                              </span>
                            </td>
                            {(summary.periods || []).map((p, i) => <td key={i}>{p.stats?.homeGoals != null && !summary.usIsHome ? p.stats.homeGoals : p.stats?.visitingGoals}</td>)}
                            <td style={{ fontWeight: 800 }}>{themScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {(() => {
                    const periods = summary.periods || []
                    const shotsFor = (p, isUs) => {
                      const home = p.stats?.homeShots
                      const visiting = p.stats?.visitingShots
                      const val = (isUs === summary.usIsHome) ? home : visiting
                      return val != null ? Number(val) : null
                    }
                    const hasPeriodShots = periods.some(p => shotsFor(p, true) != null || shotsFor(p, false) != null)
                    const usTotal = Number(us.stats?.shots) || 0
                    const themTotal = Number(them.stats?.shots) || 0
                    if (!usTotal && !themTotal) return null
                    return (
                      <div className="statcard gcpad">
                        <h2 className="statsec">Shots on Goal</h2>
                        <div className="twrap">
                          <table className="stats gcline">
                            <thead>
                              <tr>
                                <th>Period</th>
                                <th><span className="gclineth"><TeamLogo isUs logo={us.info?.logo} className="gclinelogo" size={16} />{us.info?.nickname}</span></th>
                                <th><span className="gclineth"><TeamLogo logo={them.info?.logo} className="gclinelogo" size={16} />{them.info?.nickname}</span></th>
                              </tr>
                            </thead>
                            <tbody>
                              {periods.map((p, i) => (
                                <tr key={i}>
                                  <td className="gclinename">{p.info?.shortName || p.info?.longName}</td>
                                  <td>{hasPeriodShots ? (shotsFor(p, true) ?? '—') : '—'}</td>
                                  <td>{hasPeriodShots ? (shotsFor(p, false) ?? '—') : '—'}</td>
                                </tr>
                              ))}
                              <tr>
                                <td className="gclinename">Total</td>
                                <td className="gclinetotal">{usTotal}</td>
                                <td className="gclinetotal">{themTotal}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        {!hasPeriodShots && (
                          <p className="bsm gcnone" style={{ marginTop: 10 }}>Totals only — shots were not recorded by period for this game.</p>
                        )}
                      </div>
                    )
                  })()}

                  <div className="statcard gcpad">
                    <div className="gcstatshead">
                      <TeamLogo isUs logo={us.info?.logo} className="gcstatslogo" size={30} />
                      <h2 className="statsec">Game stats</h2>
                      <TeamLogo logo={them.info?.logo} className="gcstatslogo" size={30} />
                    </div>
                    {(() => {
                      const pct = (num, den) => (den ? Math.round((Number(num) / Number(den)) * 1000) / 10 : 0)
                      const ppRecorded = (Number(us.stats?.powerPlayOpportunities) || 0) + (Number(them.stats?.powerPlayOpportunities) || 0) > 0
                      const faceoffRecorded = (Number(us.stats?.faceoffAttempts) || 0) + (Number(them.stats?.faceoffAttempts) || 0) > 0
                      const rows = [
                        { label: 'Shots on goal', a: Number(us.stats?.shots) || 0, b: Number(them.stats?.shots) || 0, recorded: true },
                        { label: 'Power-play goals', a: Number(us.stats?.powerPlayGoals) || 0, b: Number(them.stats?.powerPlayGoals) || 0, recorded: true },
                        { label: 'Power play %', a: pct(us.stats?.powerPlayGoals, us.stats?.powerPlayOpportunities), b: pct(them.stats?.powerPlayGoals, them.stats?.powerPlayOpportunities), recorded: ppRecorded, suffix: '%' },
                        ...(faceoffRecorded ? [{ label: 'Face-off %', a: pct(us.stats?.faceoffWins, us.stats?.faceoffAttempts), b: pct(them.stats?.faceoffWins, them.stats?.faceoffAttempts), recorded: true, suffix: '%' }] : []),
                        { label: 'Penalty minutes', a: Number(us.stats?.penaltyMinuteCount) || 0, b: Number(them.stats?.penaltyMinuteCount) || 0, recorded: true },
                      ]
                      return rows.map(row => {
                        // An even split when both sides are zero: a bar pinned to
                        // one end would read as a lopsided result rather than none.
                        const total = row.a + row.b
                        const pa = total ? (row.a / total) * 100 : 50
                        return (
                          <div className={`gcbar${row.recorded ? '' : ' unrecorded'}`} key={row.label}>
                            <span className="gcbarval">{row.recorded ? `${row.a}${row.suffix || ''}` : '—'}</span>
                            <span className="gcbarlab">{row.label}</span>
                            <span className="gcbarval right">{row.recorded ? `${row.b}${row.suffix || ''}` : '—'}</span>
                            <span className="gcbartrack">
                              {row.recorded ? (
                                <>
                                  <span className="gcbarfill left" style={{ width: `${pa}%`, background: 'var(--blue)' }} />
                                  <span className="gcbarfill right" style={{ width: `${100 - pa}%`, background: THEM_GREY }} />
                                </>
                              ) : <span className="gcbarnone" />}
                            </span>
                          </div>
                        )
                      })
                    })()}
                  </div>

                  <SeasonSeriesCard meetings={meetings} us={us} gameId={gameId} />

                  <div className="statcard pptop">
                    <dl className="gameinfo" style={{ borderRadius: 8, margin: 0 }}>
                      <div><strong>Venue</strong><div>{summary.details?.venue}</div></div>
                      <div><strong>Date</strong><div>{summary.details?.date}</div></div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {started && tab === 'box' && (
              <div className="gcbox">
                <div className="gpsides">
                  <button className={`gpside${side === 'us' ? ' on' : ''}`} onClick={() => setSide('us')}>{us.info?.nickname}</button>
                  <button className={`gpside${side === 'them' ? ' on' : ''}`} onClick={() => setSide('them')}>{them.info?.nickname}</button>
                </div>
                <div className="sctrl" style={{ marginBottom: 18 }}>
                  <div className="tabs">
                    <button type="button" className={`tab${boxMode === 'skaters' ? ' on' : ''}`} onClick={() => setBoxMode('skaters')}>Skaters</button>
                    <button type="button" className={`tab${boxMode === 'goalies' ? ' on' : ''}`} onClick={() => setBoxMode('goalies')}>Goaltenders</button>
                  </div>
                </div>
                <section className="gcboxsec">
                  <BoxTable side={side === 'us' ? us : them} showGoalies={boxMode === 'goalies'} />
                </section>
              </div>
            )}

            {started && tab === 'pbp' && (
              <div className="gcpbp">
                <div className="gcfilters">
                  <label className="gcfilter">
                    <span className="h6">Period</span>
                    <select value={pbpPeriod} onChange={e => setPbpPeriod(e.target.value)}>
                      <option value="">All</option>
                      {byPeriod.map(g => <option key={g.periodId} value={g.periodId}>{g.label}</option>)}
                    </select>
                  </label>
                  <label className="gcfilter">
                    <span className="h6">Team</span>
                    <select value={pbpTeam} onChange={e => setPbpTeam(e.target.value)}>
                      <option value="">All</option>
                      <option value="us">{us.info?.nickname}</option>
                      <option value="them">{them.info?.nickname}</option>
                    </select>
                  </label>
                </div>

                {(() => {
                  const shown = pbpAllPlays.filter(p =>
                    (!pbpPeriod || String(p.periodId) === pbpPeriod) &&
                    (!pbpTeam || (pbpTeam === 'us' ? p.isUs : !p.isUs)))
                  if (!shown.length) {
                    return (
                      <div className="emptybox">
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Nothing to show</p>
                        <p className="bsm" style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                          {pbpAllPlays.length ? 'No plays match these filters.' : "The league's feed only exposes goals and penalties, not a full play-by-play — and this game has none."}
                        </p>
                      </div>
                    )
                  }
                  return (
                    <div className="gcplays">
                      {shown.map((play, i) => {
                        const playSide = play.isUs ? us : them
                        if (play.kind === 'penalty') {
                          const taker = fullName(play.takenBy) || fullName(play.servedBy)
                          return (
                            <div className="pbgoal" key={i}>
                              <div className="pbrow">
                                <span className="pbtime">
                                  <span className="pbclock">{play.time}</span>
                                  <span className="pbper">{play.periodLabel}</span>
                                </span>
                                <TeamLogo isUs={play.isUs} logo={playSide.info?.logo} className="pblogo" size={26} />
                                <span className="pbbody">
                                  <span className="pbtitle">Penalty</span>
                                  <span className="pbdetail">
                                    {taker}{taker ? ' — ' : ''}{play.minutes} minutes for {play.description}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )
                        }
                        const goal = play
                        const tag = strengthTag(goal)
                        return (
                          <div className="pbgoal" key={i}>
                            <div className="pbgoalbar" style={{ background: goal.isUs ? 'var(--blue)' : THEM_GREY }}>
                              <span className="pbgoalcore">
                                <span className="pbgoalscore">
                                  <span className={`pbgoalside${goal.isUs ? ' on' : ''}`}>
                                    <TeamLogo isUs className="pbgoallogo" size={22} color={goal.isUs ? 'var(--gold)' : 'var(--blue)'} />
                                    <span className="pbgoalnum">{goal.usScore}</span>
                                  </span>
                                  <span className="pbgoallight"><IcGoalLight size={14} /></span>
                                  <span className={`pbgoalside${!goal.isUs ? ' on' : ''}`}>
                                    <span className="pbgoalnum">{goal.themScore}</span>
                                    <TeamLogo logo={them.info?.logo} className="pbgoallogo" size={22} />
                                  </span>
                                </span>
                                <span className="pbgoallab">{playSide.info?.nickname} Goal</span>
                              </span>
                            </div>
                            <div className="pbrow goal" style={{ background: goal.isUs ? 'var(--blue)' : THEM_GREY }}>
                              <span className="pbtime">
                                <span className="pbclock">{goal.time}</span>
                                <span className="pbper">{goal.periodLabel}</span>
                              </span>
                              <TeamLogo isUs={goal.isUs} logo={playSide.info?.logo} className="pblogo" size={26} color={goal.isUs ? 'var(--gold)' : 'var(--blue)'} />
                              <span className="pbbody">
                                <span className="pbtitle">
                                  {fullName(goal.scoredBy)}
                                  {goal.scoredBy?.jerseyNumber ? ` #${goal.scoredBy.jerseyNumber}` : ''}
                                  {goal.scorerGoalNumber ? ` (${goal.scorerGoalNumber})` : ''}
                                  {tag && <span className="pbstr">{tag}</span>}
                                </span>
                                <span className="pbdetail">
                                  {goal.assists?.length
                                    ? `Assists: ${goal.assists.map(a => `${fullName(a)}${a.jerseyNumber ? ` #${a.jerseyNumber}` : ''}`).join(', ')}`
                                    : 'Unassisted'}
                                </span>
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

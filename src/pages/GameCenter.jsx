import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { Logo } from '../components/Brand.jsx'
import { fetchGameSummary, scoringPlays, periodsWithPlays, penaltyPlays, allPlays, strengthTag } from '../lib/gameCenter.js'

const THEM_GREY = '#5B6A7A'

function TeamLogo({ isUs, logo, className, size }) {
  if (isUs) return <Logo size={size} color="var(--blue)" />
  return logo ? <img className={className} src={logo} alt="" /> : <span className={className} style={{ width: size, height: size }} />
}

function fullName(p) {
  return p ? `${p.firstName} ${p.lastName}`.trim() : ''
}

function GoalRow({ goal }) {
  const tag = strengthTag(goal)
  return (
    <div className="gcgoal">
      <span className="gcgoalwho">
        <span className="gcgoalname">
          {fullName(goal.scoredBy)}
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

export default function GameCenter() {
  const { gameId } = useParams()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('summary')
  const [side, setSide] = useState('us')
  const [boxMode, setBoxMode] = useState('skaters')

  useEffect(() => {
    let cancelled = false
    fetchGameSummary(gameId)
      .then(data => { if (!cancelled) setSummary(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [gameId])

  const plays = useMemo(() => (summary ? scoringPlays(summary) : []), [summary])
  const penalties = useMemo(() => (summary ? penaltyPlays(summary) : []), [summary])
  const pbpAllPlays = useMemo(() => (summary ? allPlays(summary) : []), [summary])
  const byPeriod = useMemo(() => periodsWithPlays(plays), [plays])
  const [pbpPeriod, setPbpPeriod] = useState('')
  const [pbpTeam, setPbpTeam] = useState('')

  if (error) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}><div className="wrap section"><p className="blg" style={{ color: 'var(--muted)' }}>Could not load this game.</p></div></main>
        <Footer />
      </>
    )
  }
  if (!summary) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}><div className="wrap section" /></main>
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
      <main style={{ background: '#fff' }}>
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
              <div className="gcgrid" style={{ marginTop: 20 }}>
                <div className="gccol">
                  <div className="statcard gcpad">
                    <h2 className="statsec">Matchup</h2>
                    <p className="gcnone" style={{ color: 'var(--ink)', fontWeight: 700, fontSize: 15 }}>
                      California {summary.usIsHome ? 'vs' : 'at'} {(them.info?.name || '').replace(/^MD\d+\s+/, '')}
                    </p>
                    <dl className="gameinfo" style={{ padding: 0, marginTop: 14 }}>
                      <div><strong>Venue</strong><div>{summary.details?.venue}</div></div>
                      <div><strong>Date</strong><div>{summary.details?.date}</div></div>
                      <div><strong>Time</strong><div>{summary.details?.status}</div></div>
                    </dl>
                  </div>
                </div>
                <div className="gccol">
                  <div className="statcard gcpad">
                    <h2 className="statsec">Season Records</h2>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p className="recnum">{us.seasonStats?.teamRecord?.formattedRecord || '—'}</p>
                        <p className="reclab">{us.info?.nickname}</p>
                      </div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <p className="recnum">{them.seasonStats?.teamRecord?.formattedRecord || '—'}</p>
                        <p className="reclab">{them.info?.nickname}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                        {group.plays.map((goal, i) => <GoalRow key={i} goal={goal} />)}
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
                            <td>{us.info?.nickname}</td>
                            {(summary.periods || []).map((p, i) => <td key={i}>{p.stats?.homeGoals != null && summary.usIsHome ? p.stats.homeGoals : p.stats?.visitingGoals}</td>)}
                            <td style={{ fontWeight: 800 }}>{usScore}</td>
                          </tr>
                          <tr>
                            <td>{them.info?.nickname}</td>
                            {(summary.periods || []).map((p, i) => <td key={i}>{p.stats?.homeGoals != null && !summary.usIsHome ? p.stats.homeGoals : p.stats?.visitingGoals}</td>)}
                            <td style={{ fontWeight: 800 }}>{themScore}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="statcard gcpad">
                    <h2 className="statsec">Team Stats</h2>
                    <div className="gccompare">
                      {[
                        ['Shots', Number(us.stats?.shots) || 0, Number(them.stats?.shots) || 0],
                        ['Power Play Goals', Number(us.stats?.powerPlayGoals) || 0, Number(them.stats?.powerPlayGoals) || 0],
                        ['Penalty Minutes', Number(us.stats?.penaltyMinuteCount) || 0, Number(them.stats?.penaltyMinuteCount) || 0],
                      ].map(([label, a, b]) => {
                        const total = a + b || 1
                        return (
                          <div className="gccomparerow" key={label}>
                            <span className="gccompareval">{a}</span>
                            <div>
                              <p className="gccomparelab">{label}</p>
                              <div className="gccomparebar"><span style={{ width: `${(a / total) * 100}%` }} /><span style={{ width: `${(b / total) * 100}%` }} /></div>
                            </div>
                            <span className="gccompareval">{b}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

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
                                    <TeamLogo isUs className="pbgoallogo" size={22} />
                                    <span className="pbgoalnum">{goal.usScore}</span>
                                  </span>
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
                              <TeamLogo isUs={goal.isUs} logo={playSide.info?.logo} className="pblogo" size={26} />
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

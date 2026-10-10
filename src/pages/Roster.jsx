import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { currentSeasonStartYear, seasonLabel } from '../lib/schedule.js'
import { IcPin, IcList, IcGrid, IcTable, IcArrowR } from '../components/Brand.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

const POS_LABEL = { forward: 'F', defense: 'D', goalie: 'G' }
const POS_ORDER = [
  ['forward', 'Forwards'],
  ['defense', 'Defensemen'],
  ['goalie', 'Goalies'],
]

const SORT_COLS = [
  ['number', 'No', p => Number(p.number) || 0, true],
  ['name', 'Name', p => p.name || '', false],
  ['position', 'Pos', p => p.position || '', false],
  ['class', 'Class', p => p.class || '', false],
]

function Avatar({ player, size = 72, flat = false }) {
  return (
    <img
      src={player.image}
      alt=""
      aria-hidden="true"
      onError={e => { e.currentTarget.src = FALLBACK_IMG }}
      style={{
        width: flat ? '100%' : size, height: flat ? '100%' : size, objectFit: 'cover',
        objectPosition: 'center top', borderRadius: flat ? 0 : '50%',
        flex: '0 0 auto', display: 'block', background: 'var(--ice)',
      }}
    />
  )
}

function MetaLine({ p }) {
  const parts = [p.class, p.height, p.hand && `${p.handedness} ${p.hand}`].filter(Boolean)
  return (
    <p className="bsm" style={{ margin: '5px 0 0', color: 'var(--muted)', fontWeight: 600 }}>
      <span style={{ color: 'var(--blue)', fontWeight: 800 }}>{POS_LABEL[p.position] || p.position}</span>
      {parts.map((part, i) => (
        <span key={i}><span style={{ color: 'var(--border)', margin: '0 8px' }}>|</span>{part}</span>
      ))}
    </p>
  )
}

export default function Roster() {
  const [roster, setRoster] = useState([])
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('card') // list | card | table
  const [sortBy, setSortBy] = useState('number')
  const [sortDir, setSortDir] = useState('asc')

  useEffect(() => {
    fetch('/roster-data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then(data => setRoster(data.roster || []))
      .catch(err => setError(err.message))
  }, [])

  const sorted = useMemo(() => {
    const col = SORT_COLS.find(c => c[0] === sortBy) || SORT_COLS[0]
    const [, , get, numeric] = col
    const dir = sortDir === 'desc' ? -1 : 1
    return [...roster].sort((a, b) => {
      const x = get(a)
      const y = get(b)
      const by = numeric ? x - y : String(x).localeCompare(String(y))
      return (by || (Number(a.number) || 0) - (Number(b.number) || 0)) * dir
    })
  }, [roster, sortBy, sortDir])

  const byPosition = useMemo(() => (
    POS_ORDER
      .map(([key, label]) => ({ key, label, players: sorted.filter(p => p.position === key) }))
      .filter(g => g.players.length)
  ), [sorted])

  const sortByCol = key => {
    if (sortBy === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <h1 className="pagetitle">{seasonLabel(currentSeasonStartYear())} Roster</h1>

            <div className="sctrl" style={{ marginBottom: 28 }}>
              <select className="rsel" value={sortBy}
                onChange={e => { setSortBy(e.target.value); setSortDir('asc') }} aria-label="Sort roster">
                <option value="number">Jersey</option>
                <option value="name">Name</option>
                <option value="position">Position</option>
                <option value="class">Class</option>
              </select>
              <div className="vtgroup">
                <span className="bsm vtlabel" style={{ color: 'var(--muted)', lineHeight: 1.2 }}>View<br />Type:</span>
                <button className={`vtbtn${mode === 'list' ? ' on' : ''}`} aria-label="List view" onClick={() => setMode('list')}><IcList /></button>
                <button className={`vtbtn${mode === 'card' ? ' on' : ''}`} aria-label="Card view" onClick={() => setMode('card')}><IcGrid /></button>
                <button className={`vtbtn${mode === 'table' ? ' on' : ''}`} aria-label="Table view" onClick={() => setMode('table')}><IcTable /></button>
              </div>
            </div>

            {error && <p>Error loading roster data.</p>}

            {!error && mode === 'list' && (
              <div style={{ display: 'grid', gap: 30 }}>
                {byPosition.map(group => (
                  <section key={group.key}>
                    <h2 className="posgroup">
                      {group.label}
                      <span className="posgroupn">{group.players.length}</span>
                    </h2>
                    <div style={{ display: 'grid', gap: 18 }}>
                      {group.players.map((p, i) => (
                        <article className="gamecard plaincard" key={i}>
                          <div className="gamemain">
                            <span style={{ position: 'relative', flex: '0 0 auto' }}>
                              <Avatar player={p} size={78} />
                              <span className="numbadge">{p.number || '?'}</span>
                            </span>
                            <div className="rostname">
                              <Link to={`/roster/${encodeURIComponent(p.name)}`}
                                style={{ fontFamily: 'var(--body)', fontWeight: 800, fontSize: 18, color: 'var(--ink)', textDecoration: 'none' }}>
                                {p.name}
                              </Link>
                              <MetaLine p={p} />
                            </div>
                            <div className="rosthome">
                              <p className="bsm" style={{ margin: 0, color: 'var(--ink)' }}>
                                <IcPin size={14} style={{ marginRight: 5 }} />{p.hometown}
                              </p>
                            </div>
                            <Link className="fullbio" to={`/roster/${encodeURIComponent(p.name)}`}>
                              Full Bio <IcArrowR size={16} />
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {!error && mode === 'card' && (
              <div className="cards">
                {sorted.map((p, i) => (
                  <Link to={`/roster/${encodeURIComponent(p.name)}`} className="pcard" key={i}
                    style={{ display: 'block', color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
                    <div className="pcard-photo">
                      <Avatar player={p} flat />
                      <span className="pcard-num">#{p.number || '?'}</span>
                    </div>
                    <div className="pcard-body">
                      <h3 className="h3">{p.name}</h3>
                      <p className="pcard-pos">
                        {p.position.charAt(0).toUpperCase() + p.position.slice(1)}
                      </p>
                      <div className="pcard-stats">
                        <div className="statItem">
                          <span className="statLabel">Class</span>
                          <span className="statValue">{p.class}</span>
                        </div>
                        <div className="statItem">
                          <span className="statLabel">Height</span>
                          <span className="statValue">{p.height}</span>
                        </div>
                        <div className="statItem">
                          <span className="statLabel">{p.handedness}</span>
                          <span className="statValue">{p.hand}</span>
                        </div>
                        <div className="statItem">
                          <span className="statLabel">Hometown</span>
                          <span className="statValue">{p.hometown}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!error && mode === 'table' && (
              <div className="twrap">
                <table className="stats sortable">
                  <thead>
                    <tr>
                      {SORT_COLS.map(([key, label]) => {
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
                      <th>Height</th>
                      <th>Shoots/Catches</th>
                      <th>Hometown</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((p, i) => (
                      <tr key={i}>
                        <td>{p.number}</td>
                        <td style={{ fontWeight: 700 }}>
                          <Link to={`/roster/${encodeURIComponent(p.name)}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{p.name}</Link>
                        </td>
                        <td>{POS_LABEL[p.position] || p.position}</td>
                        <td>{p.class}</td>
                        <td>{p.height}</td>
                        <td>{p.hand ? `${p.handedness} ${p.hand}` : '—'}</td>
                        <td>{p.hometown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

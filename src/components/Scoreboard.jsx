import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSchedule } from '../lib/schedule.js'
import { IcChevL, IcChevR } from './Brand.jsx'

// TODO: highlight an in-progress game (live score/clock) once live scoring is relinked.
export default function Scoreboard() {
  const [games, setGames] = useState([])
  const rowRef = useRef(null)
  const anchorRef = useRef(null)
  const [ends, setEnds] = useState({ start: true, end: false })

  useEffect(() => {
    let cancelled = false
    fetchSchedule()
      .then(all => {
        if (cancelled) return
        // Last five played, plus every game still to come — the whole rest
        // of the season, not a preview of a few — in chronological order.
        const played = all.filter(g => g.isPlayed).slice(-5)
        const upcoming = all.filter(g => !g.isPlayed)
        setGames([...played, ...upcoming])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const readEnds = useCallback(() => {
    const row = rowRef.current
    if (!row) return
    const max = row.scrollWidth - row.clientWidth
    setEnds({ start: row.scrollLeft <= 12, end: row.scrollLeft >= max - 12 })
  }, [])

  useEffect(() => {
    const row = rowRef.current
    const anchor = anchorRef.current
    if (!row) return
    if (anchor) {
      const at = anchor.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft
      row.scrollTo({ left: Math.max(0, at - 8), behavior: 'instant' })
    }
    readEnds()
    window.addEventListener('resize', readEnds)
    return () => window.removeEventListener('resize', readEnds)
  }, [games, readEnds])

  const scroll = dir => {
    if (rowRef.current) rowRef.current.scrollBy({ left: dir * 360, behavior: 'smooth' })
  }

  if (!games.length) return null

  // Anchor on the first upcoming game, so the strip opens there rather than
  // on the oldest final.
  const anchorId = (games.find(g => !g.isPlayed) || games[games.length - 1]).gameId

  return (
    <div className="sboard">
      <div className="wrap sboard-inner">
        <button className="chev" aria-label="Previous games" disabled={ends.start} onClick={() => scroll(-1)}>
          <IcChevL size={22} />
        </button>
        <div className="sboard-row" ref={rowRef} onScroll={readEnds}>
          {games.map(game => (
            <a className="scard" key={game.gameId} href={game.watchUrl || '/schedule'}
              ref={game.gameId === anchorId ? anchorRef : null}>
              <div className="scard-top">
                <span className="sdate">{game.datetimeText}</span>
              </div>
              <div className="scard-main">
                {game.logo ? <img className="slogo" src={game.logo} alt="" onError={e => { e.currentTarget.style.display = 'none' }} /> : null}
                <span className="sopp">{game.opponent}</span>
                {game.scoreText ? <span className="sscore">{game.scoreText.replace('Score: ', '')}</span> : null}
              </div>
            </a>
          ))}
        </div>
        <button className="chev" aria-label="More games" disabled={ends.end} onClick={() => scroll(1)}>
          <IcChevR size={22} />
        </button>
      </div>
    </div>
  )
}

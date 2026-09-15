import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { fetchSchedule } from '../lib/schedule.js'

function GameCard({ game }) {
  const side = (game.side || 'left').toLowerCase() === 'right' ? 'right' : 'left'
  const containerClass =
    side === 'right'
      ? 'timelineContainer timelineRight-container'
      : 'timelineContainer timelineLeft-container'
  const arrowClass = side === 'right' ? 'right-container-arrow' : 'left-container-arrow'

  return (
    <div className={containerClass}>
      {game.logo ? (
        <img src={game.logo} alt={game.opponent} onError={e => { e.currentTarget.style.display = 'none' }} />
      ) : null}
      <div className="textbox">
        <h2 className="blackText">{game.opponent}</h2>
        <h4>{game.datetimeText}</h4>
        <p>{game.locationText}</p>
        {game.scoreText ? <p>{game.scoreText}</p> : null}
        <span className={arrowClass}></span>
        <a href={game.watchUrl || ''}>Watch</a>
      </div>
    </div>
  )
}

export default function Schedule() {
  const [games, setGames] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    document.body.classList.add('sched')
    return () => document.body.classList.remove('sched')
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchSchedule()
      .then(games => {
        if (!cancelled) setGames(games)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <Header />

      <div className="timeline" id="timeline">
        {error ? (
          <div style={{ padding: '20px' }}>
            <p style={{ color: 'white' }}>Could not load schedule.</p>
          </div>
        ) : (
          games.map(game => <GameCard key={game.gameId} game={game} />)
        )}
      </div>

      <Footer />
    </>
  )
}

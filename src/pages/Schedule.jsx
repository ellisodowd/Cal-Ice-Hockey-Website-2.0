import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

function GameCard({ game }) {
  const side = (game.side || 'left').toLowerCase() === 'right' ? 'right' : 'left'
  const containerClass =
    side === 'right'
      ? 'timelineContainer timelineRight-container'
      : 'timelineContainer timelineLeft-container'
  const arrowClass = side === 'right' ? 'right-container-arrow' : 'left-container-arrow'

  return (
    <div className={containerClass}>
      <img src={game.logo} alt={game.opponent} />
      <div className="textbox">
        <h2 className="blackText">{game.opponent}</h2>
        <h4>{game.datetimeText}</h4>
        <p>{game.locationText}</p>
        <p>{game.scoreText}</p>
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
    fetch('/schedule.json', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load schedule: ${res.status}`)
        return res.json()
      })
      .then(data => setGames(Array.isArray(data.games) ? data.games : []))
      .catch(err => setError(err.message))
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
          games.map((game, i) => <GameCard key={i} game={game} />)
        )}
      </div>

      <Footer />
    </>
  )
}

import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

function PlayerCard({ player }) {
  return (
    <div className="rosterSlot">
      <div className="leftSide">
        <img
          src={player.image}
          alt={player.name}
          onError={e => { e.currentTarget.src = FALLBACK_IMG }}
        />
      </div>
      <div className="rightSide">
        <div className="top">
          <h2>#{player.number || '?'} {player.name}</h2>
        </div>
        <div className="bio">
          <div className="leftbio">
            <p><strong>Position:</strong></p>
            <p>{player.position.charAt(0).toUpperCase() + player.position.slice(1)}</p>
          </div>
          <div className="rightbio">
            <p><strong>Class:</strong></p>
            <p>{player.class}</p>
          </div>
        </div>
        <div className="greyline"></div>
        <div className="below">
          <div style={{ flexBasis: '50%' }}>
            <p><strong>Height:</strong> {player.height}</p>
          </div>
          <div style={{ flexBasis: '50%' }}>
            <p><strong>{player.handedness}:</strong> {player.hand}</p>
          </div>
        </div>
        <p><strong>Hometown:</strong> {player.hometown}</p>
      </div>
    </div>
  )
}

export default function Roster() {
  const [forwards, setForwards] = useState([])
  const [defensemen, setDefensemen] = useState([])
  const [goalies, setGoalies] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/roster-data.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
        return res.json()
      })
      .then(data => {
        const players = data.roster || []
        setForwards(players.filter(p => p.position === 'forward'))
        setDefensemen(players.filter(p => p.position === 'defense'))
        setGoalies(players.filter(p => p.position === 'goalie'))
      })
      .catch(err => setError(err.message))
  }, [])

  return (
    <div className="rosterBody">
      <Header />
      <section className="whole">
        <section className="gap"></section>
        <div className="rosterContainer">
          <input type="radio" name="slider" id="forwards" defaultChecked />
          <input type="radio" name="slider" id="defense" />
          <input type="radio" name="slider" id="goalies" />
          <nav>
            <label htmlFor="forwards" className="forwards">Forwards</label>
            <label htmlFor="defense" className="defense">Defensemen</label>
            <label htmlFor="goalies" className="goalies">Goalies</label>
            <div className="slider"></div>
          </nav>
          {error ? (
            <p style={{ color: 'white', padding: '20px' }}>Error loading roster data.</p>
          ) : (
            <section className="mobileContainer">
              <div className="content goalieContent">
                {goalies.map((p, i) => <PlayerCard key={i} player={p} />)}
              </div>
              <div className="content forwardContent">
                {forwards.map((p, i) => <PlayerCard key={i} player={p} />)}
              </div>
              <div className="content defenseContent">
                {defensemen.map((p, i) => <PlayerCard key={i} player={p} />)}
              </div>
            </section>
          )}
        </div>
      </section>
      <Footer className="rosterBottom" />
    </div>
  )
}

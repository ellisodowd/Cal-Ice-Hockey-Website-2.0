import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

function StaffCard({ person }) {
  return (
    <div className="rosterSlot coachSlot">
      <div className="leftSide">
        <img
          src={person.image || FALLBACK_IMG}
          alt={person.name || ''}
          onError={e => { e.currentTarget.src = FALLBACK_IMG }}
        />
      </div>
      <div className="rightSide">
        <h2>{person.name || ''}</h2>
        <div className="greyline"></div>
        <section className="bio">
          <h4>{person.role || ''}</h4>
          {person.contact && <h5>Contact: {person.contact}</h5>}
        </section>
      </div>
    </div>
  )
}

export default function Staff() {
  const [coaches, setCoaches] = useState([])
  const [execs, setExecs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/staff.json?v=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setCoaches(Array.isArray(data.coaches) ? data.coaches : [])
        setExecs(Array.isArray(data.executive) ? data.executive : [])
      })
      .catch(err => setError(err.message))
  }, [])

  return (
    <div className="rosterBody">
      <Header />
      <section className="whole">
        <section className="gap"></section>
        <div className="rosterContainer coachContainer">
          <input type="radio" name="slider" id="coaches" defaultChecked />
          <input type="radio" name="slider" id="staff" />
          <nav>
            <label htmlFor="coaches" className="coaches">Coaches</label>
            <label htmlFor="staff" className="staff">Executive Staff</label>
            <div className="slider"></div>
          </nav>
          {error ? (
            <p style={{ padding: '20px' }}>Error loading staff data.</p>
          ) : (
            <section>
              <div className="content coachesContent">
                {coaches.map((c, i) => <StaffCard key={i} person={c} />)}
              </div>
              <div className="content staffContent">
                {execs.map((e, i) => <StaffCard key={i} person={e} />)}
              </div>
            </section>
          )}
        </div>
      </section>
      <Footer className="rosterBottom" />
    </div>
  )
}

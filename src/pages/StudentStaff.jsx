import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const FALLBACK_IMG = '/images/blank-profile-picture-973460_960_720.jpeg'

function Photo({ person }) {
  return (
    <img
      className="stphoto"
      src={person.image || FALLBACK_IMG}
      alt=""
      aria-hidden="true"
      onError={e => { e.currentTarget.src = FALLBACK_IMG }}
    />
  )
}

export default function StudentStaff() {
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/intern-staff.json?v=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setDepartments(Array.isArray(data.departments) ? data.departments : []))
      .catch(err => setError(err.message))
  }, [])

  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <h1 className="pagetitle">Student Staff</h1>

            {error && (
              <div className="emptybox">
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Could not load staff.</p>
              </div>
            )}

            {departments.map(dept => {
              const members = Array.isArray(dept.members) ? dept.members : []
              return (
                <div className="staffsec" key={dept.name}>
                  <h2 className="staffseclab">{dept.name}</h2>

                  {dept.director && (
                    <article className="leadstaff">
                      <div className="leadphoto"><Photo person={dept.director} /></div>
                      <div className="leadbody">
                        <p className="eyebrow" style={{ color: 'var(--blue)' }}>{dept.director.role}</p>
                        <h3 className="leadname">{dept.director.name}</h3>
                        {dept.director.year && <p className="staffyear">{dept.director.year}</p>}
                      </div>
                    </article>
                  )}

                  {dept.description && <p className="deptdesc">{dept.description}</p>}

                  {members.length > 0 && (
                    <div className="staffgrid">
                      {members.map((m, i) => (
                        <article className="staffcard" key={i}>
                          <div className="staffwell"><Photo person={m} /></div>
                          <div className="staffbody">
                            <p className="staffname">{m.name}</p>
                            <p className="stafftitle">{m.role}</p>
                            {m.year && <p className="staffyear">{m.year}</p>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

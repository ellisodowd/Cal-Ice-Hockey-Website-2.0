import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

function splitContact(contact) {
  if (!contact) return { phone: '', email: '' }
  const parts = contact.split('/').map(s => s.trim()).filter(Boolean)
  const email = parts.find(p => p.includes('@')) || ''
  const phone = parts.find(p => p !== email) || ''
  return { phone, email }
}

function Face({ person }) {
  if (person.image) {
    return <img className="stphoto" src={person.image} alt="" aria-hidden="true" />
  }
  const initials = (person.name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
  return <span className="stmono" aria-hidden="true">{initials || '–'}</span>
}

export default function Staff() {
  const [coaches, setCoaches] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/staff.json?v=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => setCoaches(Array.isArray(data.coaches) ? data.coaches : []))
      .catch(err => setError(err.message))
  }, [])

  const lead = coaches.find(c => c.role === 'Head Coach') || null
  const rest = coaches.filter(c => c !== lead)
  const leadContact = splitContact(lead?.contact)

  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <h1 className="pagetitle">Hockey Operations</h1>

            {error && (
              <div className="emptybox">
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Could not load staff.</p>
              </div>
            )}

            {lead && (
              <article className="leadstaff">
                <div className="leadphoto"><Face person={lead} /></div>
                <div className="leadbody">
                  <p className="eyebrow" style={{ color: 'var(--blue)' }}>{lead.role}</p>
                  <h2 className="leadname">{lead.name}</h2>
                  {(leadContact.email || leadContact.phone) && (
                    <dl className="leadcontact">
                      {leadContact.email && (
                        <>
                          <dt>Email</dt>
                          <dd><a href={`mailto:${leadContact.email}`}>{leadContact.email}</a></dd>
                        </>
                      )}
                      {leadContact.phone && (
                        <>
                          <dt>Phone</dt>
                          <dd><a href={`tel:${leadContact.phone.replace(/[^\d+]/g, '')}`}>{leadContact.phone}</a></dd>
                        </>
                      )}
                    </dl>
                  )}
                </div>
              </article>
            )}

            {rest.length > 0 && (
              <div className="staffsec">
                <h2 className="staffseclab">Coaching<span className="staffsecn">{rest.length}</span></h2>
                <div className="staffgrid">
                  {rest.map((c, i) => {
                    const contact = splitContact(c.contact)
                    return (
                      <article className="staffcard" key={i}>
                        <div className="staffwell"><Face person={c} /></div>
                        <div className="staffbody">
                          <p className="staffname">{c.name}</p>
                          <p className="stafftitle">{c.role}</p>
                          {contact.email && <a className="staffmail" href={`mailto:${contact.email}`}>{contact.email}</a>}
                          {contact.phone && <a className="staffmail" href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`}>{contact.phone}</a>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const DEPARTMENTS = [
  'Executive Management', 'Hockey Operations', 'Communications', 'Administration',
  'Creative & Content', 'Ticketing', 'Premium & Business Intelligence',
]

function departmentFor(role) {
  const title = (role || '').toLowerCase()
  if (/broadcast|communication/.test(title)) return 'Communications'
  if (/marketing|creative|content/.test(title)) return 'Creative & Content'
  if (/ticket/.test(title)) return 'Ticketing'
  if (/premium|business intelligence/.test(title)) return 'Premium & Business Intelligence'
  if (/manager|president|advisor/.test(title)) return 'Executive Management'
  return 'Administration'
}

export default function FrontOffice() {
  const [coaches, setCoaches] = useState([])
  const [executive, setExecutive] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/staff.json?v=${Date.now()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setCoaches(Array.isArray(data.coaches) ? data.coaches : [])
        setExecutive(Array.isArray(data.executive) ? data.executive : [])
      })
      .catch(err => setError(err.message))
  }, [])

  const people = [
    ...coaches.map(c => ({ ...c, department: 'Hockey Operations' })),
    ...executive.map(p => ({ ...p, department: departmentFor(p.role) })),
  ]

  return (
    <>
      <Header />

      <main className="frontoffice">
        <header className="fohero"><div className="wrap"><h1 className="pagetitle">Front Office</h1></div></header>
        <div className="wrap focontent">
          {error && (
            <div className="emptybox">
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Could not load staff.</p>
            </div>
          )}

          {DEPARTMENTS.map(department => {
            const members = people.filter(p => p.department === department)
            if (!members.length) return null
            return (
              <section className="fosection" key={department}>
                <h2>{department}</h2>
                <table className="fotable" aria-label={`${department} staff`}>
                  <colgroup><col style={{ width: '42%' }} /><col style={{ width: '58%' }} /></colgroup>
                  <tbody>
                    {members.map((p, i) => (
                      <tr key={i}>
                        <th scope="row">{p.name}</th>
                        <td>{p.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )
          })}
        </div>
      </main>

      <Footer />
    </>
  )
}

import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

// No volunteer roles are tracked anywhere in this site's data yet, so this
// page is the honest empty state rather than invented openings — matching
// what the reference site itself renders when its volunteerRoles list is
// empty. Once there's a real list of openings to post, map them here.
export default function Volunteers() {
  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap" style={{ maxWidth: 900 }}>
            <h1 className="pagetitle">Volunteer with the program</h1>
            <p className="volintro">
              Cal Ice Hockey is student-run. Everything from the scoresheet to the livestream
              is somebody giving up an evening — these are the jobs we need filled.
            </p>

            <div className="emptybox">
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>No openings listed</p>
              <p className="bsm" style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                Check back, or get in touch if you would like to help.
              </p>
            </div>

            <div className="volfoot">
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>
                Something else you could help with?
              </p>
              <p className="bsm" style={{ margin: '6px 0 14px', color: 'var(--muted)' }}>
                We are a club team; if you have a skill we have probably got a use for it.
              </p>
              <a className="btn bNavy" href="mailto:devincox@calicehockey.com">Email the program</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

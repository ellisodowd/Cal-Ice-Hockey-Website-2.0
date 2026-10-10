import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const FORM_URL = 'https://forms.gle/nP5RbMVFuc2RLnWz9'

// The reference site's own Recruits page pulls this copy from site.recruiting,
// which is still unedited seed/placeholder text there. Rather than port that
// placeholder verbatim, this uses the real facts the club's own About page
// already states (Pac-8 Conference, dues, home rink, schedule) in the same
// layout — headline, intro, sections, "at a glance" sidebar, form CTA.
export default function Recruits() {
  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap" style={{ maxWidth: 940 }}>
            <h1 className="pagetitle">Play Hockey at Cal</h1>
            <p className="recintro">
              Cal Ice Hockey is a student-run ACHA Division II program competing in the Pac-8
              Conference. If you've played juniors, high school, or competitive club hockey and
              you're heading to Berkeley, we want to hear from you.
            </p>

            <div className="recgrid2">
              <div>
                <section className="reccard">
                  <h2 className="rectitle">What the season looks like</h2>
                  <div className="recbody">
                    <p className="artp">
                      Twenty-five to thirty games and two to three practices a week, from October
                      through March, with trips to Washington, LA, Utah, Oregon, Vegas, and more.
                      The program has placed top 3 in the conference for six straight years and
                      qualified for the ACHA Western Regional Tournament last season.
                    </p>
                    <p className="artp">
                      The annual Big Freeze against Stanford brings out over 1,500 Cal fans, Cal
                      Cheer, and the Cal Band.
                    </p>
                  </div>
                </section>

                <section className="reccard">
                  <h2 className="rectitle">What it costs</h2>
                  <div className="recbody">
                    <p className="artp">
                      Dues are $4,000 per season — among the lowest in the conference, versus
                      $5,000+ at many programs. Flights, hotels, rental cars, gear, and ice time
                      are all included.
                    </p>
                  </div>
                </section>

                <section className="reccard">
                  <h2 className="rectitle">How to get in touch</h2>
                  <div className="recbody">
                    <p className="artp">
                      Fill out the recruiting form and the coaching staff will follow up. Tell us
                      where you've played, and include a highlight link if you have one.
                    </p>
                  </div>
                </section>
              </div>

              <aside className="recside">
                <div className="reccard">
                  <h2 className="rectitle" style={{ marginBottom: 10 }}>At a glance</h2>
                  <dl className="recfacts">
                    <dt>League</dt><dd>ACHA Division II</dd>
                    <dt>Conference</dt><dd>Pac-8</dd>
                    <dt>Home rink</dt><dd>Oakland Ice Center</dd>
                    <dt>Season</dt><dd>October to March</dd>
                    <dt>Player dues</dt><dd>$4,000 / season</dd>
                  </dl>
                </div>

                <div className="reccard reccta">
                  <h2 className="rectitle">Tell us about your game</h2>
                  <p className="bsm" style={{ color: 'var(--muted)', margin: '8px 0 14px' }}>
                    The coaching staff reads every submission.
                  </p>
                  <a className="btn bNavy" href={FORM_URL} target="_blank" rel="noreferrer">
                    Interest form &rarr;
                  </a>
                  <p className="bsm" style={{ marginTop: 14, color: 'var(--muted)' }}>
                    Questions? <a href="mailto:devincox@calicehockey.com" className="staffmail">devincox@calicehockey.com</a>
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

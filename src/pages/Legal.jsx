import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const LEGAL_COPY = {
  terms: {
    title: 'Terms of Service',
    body: `# Using this site
This site is published by the Cal Ice Hockey club, a student-run team at the University of California, Berkeley. It is not an official University publication and the club is not part of Cal Athletics.

# What is here
Schedules, results, statistics and rosters are published in good faith and corrected when we find a mistake. Historical records are compiled from league and third-party sources and may be incomplete.

# Getting in touch
If something on this site is wrong, or should not be here, write to the program and we will look at it.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `# What this site collects
Nothing, unless you send it. There are two forms: the recruit interest form and the alumni list. Both ask for a name and an email address, and for whatever else you choose to fill in.

# What happens to it
Submissions go to the program's own inbox. They are not published on this site, not sold, and not passed to anybody outside the club.

# Removing your details
Ask, and we will delete them.

# Elsewhere
Links to ticketing, streaming, giving and league sites lead off this site, and what those services collect is up to them.`,
  },
  accessibility: {
    title: 'Accessibility',
    body: `# What we are aiming for
This site is built to be usable with a keyboard and with a screen reader: text over solid backgrounds, real headings, labelled controls, and images that carry a description where one helps.

# Where it falls short
Some of it is not there yet. Statistics tables are dense, and archive material inherited from elsewhere may be missing descriptions.

# Tell us
If any part of this site is hard to use, write to the program and say which part. That is the fastest way to get it fixed.`,
  },
}

// Same shape as the reference site's renderArticle(), trimmed to what this
// plain-prose copy actually uses: "# " headings and blank-line paragraphs.
function renderBody(text) {
  const lines = text.split('\n')
  const out = []
  let para = []

  const flush = () => {
    if (para.length) out.push(<p key={out.length}>{para.join(' ')}</p>)
    para = []
  }

  lines.forEach(raw => {
    const line = raw.trim()
    if (line.startsWith('# ')) {
      flush()
      out.push(<h3 key={out.length} className="arth3">{line.slice(2)}</h3>)
    } else if (!line) {
      flush()
    } else {
      para.push(line)
    }
  })
  flush()
  return out
}

export default function Legal({ which }) {
  const entry = LEGAL_COPY[which] || LEGAL_COPY.terms

  return (
    <>
      <Header />

      <main style={{ background: '#fff', minHeight: '50vh' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap" style={{ maxWidth: 760 }}>
            <h1 className="pagetitle">{entry.title}</h1>
            <div className="legalbody">{renderBody(entry.body)}</div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

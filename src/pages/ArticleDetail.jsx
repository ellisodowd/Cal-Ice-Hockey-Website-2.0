import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { IcChevL } from '../components/Brand.jsx'

export default function ArticleDetail() {
  const { id } = useParams()
  const [articles, setArticles] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/articles.json', { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load articles: ${res.status}`)
        return res.json()
      })
      .then(data => setArticles(Array.isArray(data.articles) ? data.articles : []))
      .catch(err => setError(err.message))
  }, [])

  const post = articles.find(a => a.id === id)
  const others = articles.filter(a => a.id !== id).slice(0, 3)

  if (error) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}><div className="wrap section"><p className="blg" style={{ color: 'var(--muted)' }}>Could not load this story.</p></div></main>
        <Footer />
      </>
    )
  }

  if (articles.length && !post) {
    return (
      <>
        <Header />
        <main style={{ background: '#fff' }}>
          <section className="section"><div className="wrap">
            <h1 className="h2" style={{ color: 'var(--blue)' }}>Story not found</h1>
            <Link className="backlink" to="/news"><IcChevL size={15} /> Back to News</Link>
          </div></section>
        </main>
        <Footer />
      </>
    )
  }
  if (!post) return null // still loading

  return (
    <>
      <Header />
      <main className="section artpage" style={{ background: '#fff' }}>
        <div className="wrap backbar" style={{ maxWidth: 760 }}>
          <Link className="backlink" to="/news"><IcChevL size={15} /> Back to News</Link>
        </div>

        <div className="wrap" style={{ maxWidth: 760 }}>
          <h1 className="h1" style={{ color: 'var(--blue)', margin: '0 0 12px', fontSize: 'clamp(2rem,4.5vw,3rem)' }}>
            {post.title}
          </h1>

          {post.image && <img className="artcover" src={`/${post.image}`} alt="" />}

          <div className="artbyline">
            <p className="artbylinewho">
              {post.author ? `${post.author} · ` : ''}{post.dateText}
            </p>
          </div>

          <div className="article">
            {post.body?.map((p, i) => <p className="artp" key={i}>{p}</p>)}
          </div>

          {post.video && (
            <div className="blog-video" style={{ marginTop: 20 }}>
              <iframe src={post.video} title="Video" allowFullScreen
                style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 12 }} />
            </div>
          )}

          {others.length > 0 && (
            <div style={{ marginTop: 34, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
              <p className="artlabel" style={{ marginBottom: 14 }}>More headlines</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {others.map(a => (
                  <Link key={a.id} className="artmore" to={`/news/${a.id}`}>
                    <span className="artmorethumb"><img src={`/${a.image}`} alt="" loading="lazy" /></span>
                    <span className="artmoretext">
                      <span className="artmoretitle">{a.title}</span>
                    </span>
                    <span className="artmoredate">{a.dateText}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

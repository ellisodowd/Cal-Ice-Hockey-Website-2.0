import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

function ArticleCard({ article, feat }) {
  return (
    <a className={`newscard${feat ? ' feat' : ''}`} href={article.href}>
      <div className="newsart">
        <img src={article.image} alt="" className={article.imgClass || ''} />
        <span className="newstag">{article.dateText}</span>
      </div>
      <div className="newsbody">
        <h3 className="h3">{article.title}</h3>
        <p>{article.excerpt}</p>
      </div>
    </a>
  )
}

export default function News() {
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

  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap">
            <h1 className="pagetitle">News</h1>

            {error ? (
              <p>Could not load news.</p>
            ) : (
              <div className="newsgrid">
                {articles.map((a, i) => (
                  <ArticleCard key={i} article={a} feat={i === 0} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

import { useEffect, useState } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

function ArticleThumbnail({ article }) {
  return (
    <div className="articleThumbnail">
      <div className="articleImg">
        <img src={article.image} alt="" />
      </div>
      <div className="articleText">
        <span>{article.dateText}</span>
        <a href={article.href} className={article.titleClass || 'articleTitle'}>{article.title}</a>
        <p>{article.excerpt}</p>
        <a href={article.href}>Read More</a>
      </div>
    </div>
  )
}

export default function Articles() {
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
    <div className="articlesBody">
      <Header />

      <section className="banner articlesBanner">
        <video id="background-video" autoPlay loop muted poster="/images/ArticlesBanner.mp4">
          <source src="/images/ArticlesBanner.mp4" type="video/mp4" />
        </video>
      </section>

      <section className="articles">
        <div className="articlesHeading"></div>
        <div className="articlesContainer" id="articlesContainer">
          {error ? (
            <div style={{ padding: '20px' }}>
              <p style={{ color: 'white' }}>Could not load articles.</p>
            </div>
          ) : (
            articles.map((a, i) => <ArticleThumbnail key={i} article={a} />)
          )}
        </div>
      </section>

      <Footer className="rosterBottom" />
    </div>
  )
}

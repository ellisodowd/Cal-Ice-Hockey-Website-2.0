import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <>
      <Header />

      <section className="banner">
        <video id="background-video" autoPlay loop muted playsInline preload="metadata" poster="/images/HomeBanner-poster.jpg">
          <source src="/images/HomeBanner.mp4" type="video/mp4" />
        </video>

        <a
          className="heroAnnouncement"
          href="https://www.gofevo.com/event/Universitycalifornia22"
          target="_blank"
          rel="noreferrer"
        >
          <p className="heroAnnouncement__text">
            The Golden Bears and San Jose Sharks are hosting a youth hockey clinic at Oakland Ice Center
          </p>
          <span className="heroAnnouncement__arrow" aria-hidden="true">
            <svg viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12h34M27 3l9 9-9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </section>

      <section className="MeetTheBears">
        <div className="boxMTB">
          <div className="leftMTB">
            <img src="/images/MeetTheBearsBanner.jpg" alt="California Ice Hockey Pregame Lineup" />
          </div>
          <div className="rightMTB">
            <div className="roster-button-container">
              <mark className="MTBOverlay">Meet The Bears</mark>
              <Link to="/roster" className="roster-button">View The Roster</Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <section className="Stream">
          <div className="boxStream">
            <div className="leftStream">
              <section className="StreamContainer">
                <mark className="StreamingOverlay">Now Streaming!</mark>
                <section className="logoContainer">
                  <div className="StreamCal">
                    <img src="/images/California_Golden_Bears_logo.svg.png" alt="Cal" />
                  </div>
                  <div className="Blackdog">
                    <img src="/images/darkblueblackdog.png" alt="BlackDog" />
                  </div>
                </section>
                <a
                  href="https://www.bdehockey.com/free-live.php?con=watchCAL&type=l&desc=CAL%20Hockey%20-%20University%20of%20California%20Berkeley%20FREE"
                  target="_blank"
                  rel="noreferrer"
                  className="streaming-button"
                >
                  Live &amp; On Demand
                </a>
              </section>
            </div>
            <div className="rightStream">
              <img src="/images/NowStreamingBanner.jpg" alt="California Ice Hockey Celebration Photo" />
            </div>
          </div>
        </section>

        <div className="calendarContainer">
          <iframe
            src="https://embed.styledcalendar.com/#c4j9HaWSYeOTvNFYrSeK"
            title="Styled Calendar"
            className="styled-calendar-container"
            frameBorder="0"
            data-cy="calendar-embed-iframe"
          />
          <script async type="module" src="https://embed.styledcalendar.com/assets/parent-window.js" />
        </div>

        <Footer />
      </section>
    </>
  )
}

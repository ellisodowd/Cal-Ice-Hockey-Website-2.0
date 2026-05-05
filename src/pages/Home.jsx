import { Link } from 'react-router-dom'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

export default function Home() {
  return (
    <>
      <Header />

      <section className="banner">
        <video id="background-video" autoPlay loop muted poster="/images/HomePageVideo.mp4">
          <source src="/images/HomePageVideo.mp4" type="video/mp4" />
        </video>
      </section>

      <section className="MeetTheBears">
        <div className="boxMTB">
          <div className="leftMTB">
            <img src="/images/MeetTheBearsBanner.jpg" alt="Cal Ice Hockey Pregame Lineup" />
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
              <img src="/images/NowStreamingBanner.jpg" alt="Cal Ice Hockey Celebration Photo" />
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

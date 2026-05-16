import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

export default function About() {
  return (
    <div className="aboutBody">
      <Header />

      <section className="aboutHero">
        <div className="aboutHeroOverlay">
          <h1>California Golden Bears Ice Hockey</h1>
          <p>
            Compete at the highest level of club hockey while earning a degree
            from the #1 public university in the world.
          </p>
        </div>
      </section>

      <section className="aboutContent">
        <div className="aboutCard">
          <h2>UC Berkeley</h2>
          <ul>
            <li>
              #1 Public University in the world (US News and World Report) with
              35 Nobel Prize winners.
            </li>
            <li>
              Over 10,000 undergraduate and graduate courses covering more than
              300 degree programs.
            </li>
            <li>
              Located on a beautiful campus in the heart of the Bay Area, just
              15 miles from San Francisco.
            </li>
            <li>
              Over 1,400 student clubs &amp; organizations, including Greek
              Life, to join.
            </li>
            <li>
              17.8 to 1 student-to-faculty ratio. 71% of undergraduate classes
              have less than 30 students.
            </li>
            <li>
              More than 60% of undergraduate students receive financial aid.
            </li>
          </ul>
        </div>

        <div className="aboutCard">
          <h2>Cal Ice Hockey</h2>
          <ul>
            <li>
              We compete in the Pac-8 Conference and have consistently placed
              top 3 the past 6 years.
            </li>
            <li>
              25–30 games and 2–3 practices per week. Trips to Washington, LA,
              Utah, Oregon, Vegas, and more.
            </li>
            <li>
              Qualified for the ACHA Western Regional Tournament last season.
            </li>
            <li>
              The annual "Big Freeze" against Stanford brings over 1,500 Cal
              fans, Cal Cheer, and the Cal Band.
            </li>
            <li>
              Some of the lowest dues in the conference at $4,000 per season
              (vs. $5,000+ at many programs). Flights, hotels, rental cars,
              gear, and ice time all included.
            </li>
            <li>
              <strong>Interested recruits</strong> should fill out our{" "}
              <a
                href="https://forms.gle/nP5RbMVFuc2RLnWz9"
                target="_blank"
                rel="noreferrer"
              >
                recruiting form
              </a>{" "}
              so we can stay in touch throughout the admissions process.
            </li>
          </ul>
        </div>

        <div className="aboutCard">
          <h2>Admissions</h2>
          <ul>
            {/* <li>
              A select few players each year may receive a Special Talent Form
              from the Head Coach to augment their application. Reach out to
              Devin Cox for more information.
            </li> */}
            <li>
              UC Berkeley offers a wide variety of academic scholarships for
              prospective students.
            </li>
            <li>
              Minimum 3.0 GPA for 10th/11th grade courses (Freshmen) or college
              coursework (Transfers).
            </li>
            <li>
              Admissions use a holistic approach that goes beyond academic
              excellence.
            </li>
            <li>
              Applications due November 30th. One application covers all UCs
              ($70 per campus).
            </li>
          </ul>
        </div>

        <div className="aboutContact">
          <h2>Contact</h2>
          <div className="contactGrid">
            <div className="contactPerson">
              <span className="contactRole">Head Coach</span>
              <span className="contactName">Devin Cox</span>
              <a href="mailto:devincox99@berkeley.edu">
                devincox99@berkeley.edu
              </a>
            </div>
            <div className="contactPerson">
              <span className="contactRole">President</span>
              <span className="contactName">Liam Collins</span>
              <a href="mailto:liam.collins@berkeley.edu">
                liam.collins@berkeley.edu
              </a>
            </div>
            <div className="contactPerson">
              <span className="contactRole">University</span>
              <span className="contactName">UC Berkeley</span>
              <a
                href="https://admissions.berkeley.edu"
                target="_blank"
                rel="noreferrer"
              >
                berkeley.edu/admissions
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer className="rosterBottom" />
    </div>
  );
}

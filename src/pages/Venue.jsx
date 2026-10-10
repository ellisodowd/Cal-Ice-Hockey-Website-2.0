import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import { IcPin, IcPhone, IcLink, IcTrain, IcBus, IcCar } from '../components/Brand.jsx'

const ADDRESS = '519 18th Street, Oakland, CA 94612'
const PHONE = '(510) 268-9000'
const WEBSITE = 'https://www.oaklandice.com'
const MAP_URL = 'https://www.google.com/maps/dir/?api=1&destination=519+18th+Street,+Oakland,+CA+94612'

const ABOUT = [
  "Cal plays its home games at the Oakland Ice Center, a two-sheet rink in downtown Oakland run by Sharks Sports & Entertainment, the company behind the San Jose Sharks. It opened in 1995 and has an NHL-size sheet at 200 by 85 feet and an Olympic sheet at 200 by 100.",
  'It is a public rink the rest of the week, so the building is shared with figure skating, broomball, curling and open skate sessions.',
]

const DIRECTIONS = [
  {
    mode: 'BART',
    Icon: IcTrain,
    body: [
      'The 19th Street Oakland station is less than a block from the door, which makes this the easy way in from campus.',
      'From Downtown Berkeley take a Richmond-line train toward Oakland and get off at 19th Street — three stops, no transfer, about nine minutes. Trains run roughly every fifteen minutes.',
    ],
  },
  {
    mode: 'AC Transit',
    Icon: IcBus,
    body: [
      'The rink sits among the downtown Oakland bus stops. Routes and times are on the AC Transit site; the useful stop is whichever one puts you on Broadway around 19th.',
    ],
  },
  {
    mode: 'Driving and parking',
    Icon: IcCar,
    body: [
      'Park at the Dalziel Garage on 16th Street between Clay and San Pablo. Pay through the ParkMobile app and get it validated inside — validation is free on weekday evenings from 4pm and on Saturdays from 8am, both until 1am.',
      'The garage is closed on Sundays. Street parking and the 18th Street Uptown lot are free that day.',
    ],
  },
]

export default function Venue() {
  return (
    <>
      <Header />

      <main style={{ background: '#fff' }}>
        <section className="section" style={{ paddingTop: 36 }}>
          <div className="wrap" style={{ maxWidth: 900 }}>
            <p className="veneyebrow">Home rink</p>
            <h1 className="pagetitle">Oakland Ice Center</h1>

            <div className="venfacts">
              <a className="venfact" href={MAP_URL} target="_blank" rel="noreferrer">
                <IcPin size={17} />
                <span>{ADDRESS}</span>
              </a>
              <a className="venfact" href={`tel:${PHONE.replace(/[^\d+]/g, '')}`}>
                <IcPhone size={17} />
                <span>{PHONE}</span>
              </a>
              <a className="venfact" href={WEBSITE} target="_blank" rel="noreferrer">
                <IcLink size={17} />
                <span>{WEBSITE.replace(/^https?:\/\//, '')}</span>
              </a>
            </div>

            <div className="venabout">
              {ABOUT.map((p, i) => <p key={i}>{p}</p>)}
            </div>

            <h2 className="venhead">Getting there from campus</h2>
            <div className="vengrid">
              {DIRECTIONS.map(d => (
                <article className="vencard" key={d.mode}>
                  <div className="venmode">
                    <span className="venicon"><d.Icon size={18} /></span>
                    <h3 className="venmodename">{d.mode}</h3>
                  </div>
                  <div className="venbody">
                    {d.body.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                </article>
              ))}
            </div>

            <a className="btn bNavy venmapbtn" href={MAP_URL} target="_blank" rel="noreferrer">
              <IcPin size={16} /> Directions
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

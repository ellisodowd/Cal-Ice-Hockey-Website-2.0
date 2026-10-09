import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Schedule from './pages/Schedule.jsx'
import Roster from './pages/Roster.jsx'
import Staff from './pages/Staff.jsx'
// import FrontOffice from './pages/FrontOffice.jsx'
// import Volunteers from './pages/Volunteers.jsx'
import Recruits from './pages/Recruits.jsx'
import News from './pages/News.jsx'
import Stats from './pages/Stats.jsx'
import Venue from './pages/Venue.jsx'
import Legal from './pages/Legal.jsx'
import PlayerBio from './pages/PlayerBio.jsx'
import GameCenter from './pages/GameCenter.jsx'
import ArticleDetail from './pages/ArticleDetail.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/game/:gameId" element={<GameCenter />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/roster/:name" element={<PlayerBio />} />
        <Route path="/recruits" element={<Recruits />} />
        <Route path="/staff" element={<Staff />} />
        {/* <Route path="/front-office" element={<FrontOffice />} /> */}
        {/* <Route path="/volunteers" element={<Volunteers />} /> */}
        <Route path="/news" element={<News />} />
        <Route path="/news/:id" element={<ArticleDetail />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/venue" element={<Venue />} />
        <Route path="/terms" element={<Legal which="terms" />} />
        <Route path="/privacy" element={<Legal which="privacy" />} />
        <Route path="/accessibility" element={<Legal which="accessibility" />} />
      </Routes>
    </BrowserRouter>
  )
}

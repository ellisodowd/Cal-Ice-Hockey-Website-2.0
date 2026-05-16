import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Schedule from './pages/Schedule.jsx'
import Roster from './pages/Roster.jsx'
import Staff from './pages/Staff.jsx'
import Articles from './pages/Articles.jsx'
import About from './pages/About.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}

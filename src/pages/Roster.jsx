import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const FALLBACK_IMG = "/images/blank-profile-picture-973460_960_720.jpeg";

function PlayerCard({ player }) {
  return (
    <div className="rosterSlot">
      <div className="leftSide">
        <div className="playerImgWrap">
          <img
            src={player.image}
            alt={player.name}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMG;
            }}
          />
          <span className="jerseyBadge">#{player.number || "?"}</span>
        </div>
      </div>
      <div className="rightSide">
        <div className="top">
          <h2>{player.name}</h2>
          <span className="positionTag">
            {player.position.charAt(0).toUpperCase() + player.position.slice(1)}
          </span>
        </div>
        <div className="playerStats">
          <div className="statItem">
            <span className="statLabel">Class</span>
            <span className="statValue">{player.class}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Height</span>
            <span className="statValue">{player.height}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">{player.handedness}</span>
            <span className="statValue">{player.hand}</span>
          </div>
          <div className="statItem">
            <span className="statLabel">Hometown</span>
            <span className="statValue">{player.hometown}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Roster() {
  const [forwards, setForwards] = useState([]);
  const [defensemen, setDefensemen] = useState([]);
  const [goalies, setGoalies] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/roster-data.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const players = data.roster || [];
        setForwards(players.filter((p) => p.position === "forward"));
        setDefensemen(players.filter((p) => p.position === "defense"));
        setGoalies(players.filter((p) => p.position === "goalie"));
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="rosterBody">
      <Header />
      <section className="whole">
        <section className="gap"></section>
        <div className="rosterContainer">
          <input type="radio" name="slider" id="forwards" defaultChecked />
          <input type="radio" name="slider" id="defense" />
          <input type="radio" name="slider" id="goalies" />
          <nav>
            <label htmlFor="forwards" className="forwards">
              Forwards
            </label>
            <label htmlFor="defense" className="defense">
              Defensemen
            </label>
            <label htmlFor="goalies" className="goalies">
              Goalies
            </label>
            <div className="slider"></div>
          </nav>
          {error ? (
            <p style={{ color: "white", padding: "20px" }}>
              Error loading roster data.
            </p>
          ) : (
            <section className="mobileContainer">
              <div className="content goalieContent">
                {goalies.map((p, i) => (
                  <PlayerCard key={i} player={p} />
                ))}
              </div>
              <div className="content forwardContent">
                {forwards.map((p, i) => (
                  <PlayerCard key={i} player={p} />
                ))}
              </div>
              <div className="content defenseContent">
                {defensemen.map((p, i) => (
                  <PlayerCard key={i} player={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
      <Footer className="rosterBottom" />
    </div>
  );
}

import { loadJsonp } from './jsonp.js'

const KEY = 'e6867b36742a0c9d'
const BASE = 'https://lscluster.hockeytech.com/feed/index.php?feed=statviewfeed'
  + `&key=${KEY}&site_id=2&client_code=acha&lang=en&league_id=1`

function rowsOf(payload) {
  const holder = Array.isArray(payload) ? payload[0] : payload
  return holder?.sections?.[0]?.data || []
}

async function scheduleRows(teamId, seasonId) {
  const data = await loadJsonp(`${BASE}&view=schedule&season=${seasonId}&team=${teamId}&month=-1&location=homeaway`)
  return rowsOf(data)
}

// An opponent's own season record, computed the same way schedule.js's
// seasonStats() does for us — same feed, just a different team id.
export async function fetchOpponentRecord(teamId, seasonId) {
  const rows = await scheduleRows(teamId, seasonId)
  let gp = 0, w = 0, l = 0, t = 0, gf = 0, ga = 0
  for (const entry of rows) {
    const row = entry.row
    const isHome = String(entry.prop?.home_team_city?.teamLink) === String(teamId)
    const played = /^\d+$/.test(row.home_goal_count) && /^\d+$/.test(row.visiting_goal_count)
    if (!played) continue
    const us = Number(isHome ? row.home_goal_count : row.visiting_goal_count)
    const opp = Number(isHome ? row.visiting_goal_count : row.home_goal_count)
    gp++; gf += us; ga += opp
    if (us > opp) w++
    else if (us < opp) l++
    else t++
  }
  return { gp, w, l, t, gf, ga }
}

function playerKey(info) {
  return `${info.jerseyNumber}-${info.lastName}`
}

// The public feed has no single "team season stats" view — only per-game box
// scores — so a season total means walking every finished game via
// gameSummary, same technique as scripts/fetch-player-stats.mjs, just
// pointed at an arbitrary opponent instead of Cal.
export async function fetchOpponentSeasonTotals(teamId, seasonId) {
  const rows = await scheduleRows(teamId, seasonId)
  const gameIds = rows
    .filter(entry => /^\d+$/.test(entry.row.home_goal_count) && /^\d+$/.test(entry.row.visiting_goal_count))
    .map(entry => entry.row.game_id)

  const skaters = new Map()
  const goalies = new Map()
  await Promise.all(gameIds.map(async gameId => {
    const summary = await loadJsonp(`${BASE}&view=gameSummary&game_id=${gameId}`)
    const homeIsThem = Number(summary?.homeTeam?.info?.id) === Number(teamId)
    const side = homeIsThem ? summary.homeTeam : summary.visitingTeam
    if (!side) return
    const oppGoals = Number((homeIsThem ? summary.visitingTeam : summary.homeTeam)?.stats?.goals) || 0

    for (const row of side.skaters || []) {
      const key = playerKey(row.info)
      const line = skaters.get(key) || {
        name: `${row.info.firstName} ${row.info.lastName}`.trim(),
        number: row.info.jerseyNumber, position: row.info.position,
        gp: 0, g: 0, a: 0, pim: 0,
      }
      line.gp += 1
      line.g += Number(row.stats.goals) || 0
      line.a += Number(row.stats.assists) || 0
      line.pim += Number(row.stats.penaltyMinutes) || 0
      skaters.set(key, line)
    }
    for (const row of side.goalies || []) {
      if (!row.stats?.timeOnIce || row.stats.timeOnIce === '0:00') continue
      const key = playerKey(row.info)
      const line = goalies.get(key) || {
        name: `${row.info.firstName} ${row.info.lastName}`.trim(),
        number: row.info.jerseyNumber,
        gp: 0, ga: 0, saves: 0, shotsAgainst: 0, so: 0,
      }
      line.gp += 1
      const ga = Number(row.stats.goalsAgainst) || 0
      line.ga += ga
      line.saves += Number(row.stats.saves) || 0
      line.shotsAgainst += Number(row.stats.shotsAgainst) || 0
      if (ga === 0 && oppGoals === 0) line.so += 1
      goalies.set(key, line)
    }
  }))

  return { skaters: [...skaters.values()], goalies: [...goalies.values()] }
}

// The feed's roster view comes back empty for every team we've checked
// (teams publish rosters on their own sites, not to the league database) —
// this surfaces whatever's there, if anything, rather than assuming it.
export async function fetchOpponentRoster(teamId, seasonId) {
  try {
    const data = await loadJsonp(`${BASE}&view=roster&team=${teamId}&season_id=${seasonId}`)
    const groups = data?.roster?.[0]?.sections || []
    const players = []
    for (const g of groups) {
      for (const row of g.data || []) players.push({ ...row, group: g.title })
    }
    return players
  } catch {
    return []
  }
}

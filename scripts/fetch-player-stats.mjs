/**
 * Backfill season player/goalie stats from the ACHA/HockeyTech feed's
 * gameSummary view — the same feed schedule.js and
 * fetch-schedule-history.mjs already use, just a different view.
 *
 * gameSummary returns a full per-player box score for both teams in a
 * finished game (goals/assists/PIM/shots for skaters; saves/goals-against/
 * TOI for goalies) directly — no play-by-play reconstruction needed for
 * these core numbers. Situational columns the reference site shows (PPG,
 * SHG, shootout goals, tying goals) do need play-by-play detail this feed
 * doesn't expose per-player, so those are left out rather than faked.
 *
 * Unlike fetch-schedule-history.mjs, this INCLUDES the current season —
 * stats are a once-a-game snapshot, not something that needs live
 * minute-to-minute freshness, so re-running this script after each game is
 * the refresh mechanism.
 *
 * Run: node scripts/fetch-player-stats.mjs   ->  public/player-stats.json
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeFeedRow } from '../src/lib/schedule.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const KEY = 'e6867b36742a0c9d'
const BASE = 'https://lscluster.hockeytech.com/feed/index.php?feed=statviewfeed'
  + `&key=${KEY}&site_id=2&client_code=acha&lang=en&league_id=1`
const CAL = /California-Berkeley/i
const CAL_TEAM_ID = 241

async function get(params) {
  const text = await fetch(BASE + params).then(r => r.text())
  const trimmed = text.trim()
  return JSON.parse(trimmed.startsWith('(') ? trimmed.slice(1, -1) : trimmed)
}

function rowsOf(payload) {
  const holder = Array.isArray(payload) ? payload[0] : payload
  return (holder && holder.sections && holder.sections[0] && holder.sections[0].data) || []
}

function seasonStartYear(seasonName) {
  const match = /^(\d{4})-\d{2,4}/.exec(seasonName)
  return match ? parseInt(match[1], 10) : null
}

function emptySkater(info) {
  return {
    name: `${info.firstName} ${info.lastName}`.trim(),
    number: info.jerseyNumber,
    position: info.position,
    gp: 0, g: 0, a: 0, pim: 0, shots: 0,
  }
}

function emptyGoalie(info) {
  return {
    name: `${info.firstName} ${info.lastName}`.trim(),
    number: info.jerseyNumber,
    gp: 0, w: 0, l: 0, t: 0, ga: 0, saves: 0, shotsAgainst: 0, so: 0,
  }
}

function playerKey(info) {
  return `${info.jerseyNumber}-${info.lastName}`
}

async function statsForSeason(seasonId, startYear) {
  const rows = rowsOf(await get(`&view=schedule&season_id=${seasonId}&team=${CAL_TEAM_ID}`))
  const games = rows
    .map(entry => normalizeFeedRow(entry, startYear))
    .filter(Boolean)
    .filter(g => g.isPlayed)

  const skaters = new Map()
  const goalies = new Map()
  const gameLines = []

  for (const game of games) {
    const summary = await get(`&view=gameSummary&game_id=${game.gameId}`)
    const homeIsCal = Number(summary?.homeTeam?.info?.id) === CAL_TEAM_ID
    const visitingIsCal = Number(summary?.visitingTeam?.info?.id) === CAL_TEAM_ID
    if (!homeIsCal && !visitingIsCal) {
      console.warn(`game ${game.gameId}: neither side is Cal, skipping`)
      continue
    }
    const side = homeIsCal ? summary.homeTeam : summary.visitingTeam
    const opp = homeIsCal ? summary.visitingTeam : summary.homeTeam

    for (const row of side.skaters || []) {
      const key = playerKey(row.info)
      const line = skaters.get(key) || emptySkater(row.info)
      line.gp += 1
      line.g += Number(row.stats.goals) || 0
      line.a += Number(row.stats.assists) || 0
      line.pim += Number(row.stats.penaltyMinutes) || 0
      line.shots += Number(row.stats.shots) || 0
      skaters.set(key, line)
    }

    const dressedGoalies = (side.goalies || []).filter(g => g.stats && g.stats.timeOnIce && g.stats.timeOnIce !== '0:00')
    // The decision goes to whoever played the most of the game — usually the
    // only goalie dressed at this level, occasionally a relief appearance.
    const starter = dressedGoalies.sort((a, b) => (b.stats.saves || 0) - (a.stats.saves || 0))[0]
    for (const row of side.goalies || []) {
      const key = playerKey(row.info)
      const line = goalies.get(key) || emptyGoalie(row.info)
      if (row.stats.timeOnIce && row.stats.timeOnIce !== '0:00') {
        line.gp += 1
        line.ga += Number(row.stats.goalsAgainst) || 0
        line.saves += Number(row.stats.saves) || 0
        line.shotsAgainst += Number(row.stats.shotsAgainst) || 0
        if (row === starter) {
          if (game.usGoals > game.oppGoals) line.w += 1
          else if (game.usGoals < game.oppGoals) line.l += 1
          else line.t += 1
          if (Number(row.stats.goalsAgainst) === 0) line.so += 1
        }
      }
      goalies.set(key, line)
    }

    // Team-level numbers (shots, penalty minutes, power play) come straight
    // off gameSummary's own per-team stats block — same call, no extra
    // request, and no play-by-play needed since this is already a total.
    const sidePim = [...(side.skaters || []), ...(side.goalies || [])]
      .reduce((n, r) => n + (Number(r.stats?.penaltyMinutes) || 0), 0)
    gameLines.push({
      gameId: game.gameId,
      sortDate: game.sortDate,
      opponent: game.opponent,
      homeAway: game.homeAway,
      datetimeText: game.datetimeText,
      usGoals: game.usGoals,
      oppGoals: game.oppGoals,
      shots: side.stats?.shots ?? null,
      oppShots: opp.stats?.shots ?? null,
      pim: sidePim,
      ppGoals: side.stats?.powerPlayGoals ?? null,
      ppOpportunities: side.stats?.powerPlayOpportunities ?? null,
      oppPpGoals: opp.stats?.powerPlayGoals ?? null,
      oppPpOpportunities: opp.stats?.powerPlayOpportunities ?? null,
    })
  }

  gameLines.sort((a, b) => a.sortDate - b.sortDate)
  for (const g of gameLines) delete g.sortDate
  return { skaters: [...skaters.values()], goalies: [...goalies.values()], games: gameLines }
}

const allSeasons = (await get('&view=seasonsForLeague')).seasons
  .filter(s => !/women/i.test(s.name) && /men's (divisions|regular season)/i.test(s.name))
  .map(s => ({ id: s.id, name: s.name }))
  .sort((a, b) => Number(a.id) - Number(b.id))

console.log("Men's regular seasons in the feed:")
for (const s of allSeasons) console.log(`  ${s.id}  ${s.name}`)

const seasons = []
for (const s of allSeasons) {
  const teams = (await get(`&view=teamsForSeason&season_id=${s.id}`)).teams || []
  const cal = teams.find(t => CAL.test(t.name || ''))
  if (!cal) {
    console.log(`\n${s.name}: Cal not in this season, skipping`)
    continue
  }
  const startYear = seasonStartYear(s.name)
  const { skaters, goalies, games } = await statsForSeason(s.id, startYear)
  console.log(`\n${s.name}: ${games.length} finished games, ${skaters.length} skaters, ${goalies.length} goalies`)
  if (!games.length) continue

  skaters.sort((a, b) => (b.g + b.a) - (a.g + a.a) || b.g - a.g)
  goalies.sort((a, b) => b.saves - a.saves)
  seasons.push({ seasonId: s.id, seasonName: s.name, startYear, skaters, goalies, games })
}

seasons.sort((a, b) => b.startYear - a.startYear)

await writeFile(
  path.join(dir, '../public/player-stats.json'),
  JSON.stringify({ seasons }, null, 2),
  'utf8'
)
console.log(`\nWrote public/player-stats.json (${seasons.length} seasons)`)

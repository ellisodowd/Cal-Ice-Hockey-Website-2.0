/**
 * Backfill past seasons' schedules from the ACHA/HockeyTech feed — the same
 * feed src/lib/schedule.js already uses live for the current season.
 *
 * Run offline (not in the browser) because this makes ~1 + 2N requests
 * against lscluster.hockeytech.com, and because the feed has no CORS headers
 * — the live site dodges that with JSONP, but a plain Node fetch has no such
 * restriction in the first place.
 *
 * How far back it goes is not a choice: the league's men's regular seasons
 * in this system begin at 2021-22 (season id 10). Season id 1 (2020-21)
 * exists but has zero Cal games. Nothing earlier is there to fetch.
 *
 * Run: node scripts/fetch-schedule-history.mjs   ->  public/schedule-history.json
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeFeedRow, CURRENT_SEASON_ID } from '../src/lib/schedule.js'

const dir = path.dirname(fileURLToPath(import.meta.url))
const KEY = 'e6867b36742a0c9d'
const BASE = 'https://lscluster.hockeytech.com/feed/index.php?feed=statviewfeed'
  + `&key=${KEY}&site_id=2&client_code=acha&lang=en&league_id=1`
const CAL = /California-Berkeley/i

// The feed answers as JSON, sometimes wrapped in parentheses.
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

const allSeasons = (await get('&view=seasonsForLeague')).seasons
  // "Women's Divisions" contains "men's Divisions", so a case-insensitive
  // match on the men's name alone picks up both.
  .filter(s => !/women/i.test(s.name) && /men's (divisions|regular season)/i.test(s.name))
  .map(s => ({ id: s.id, name: s.name }))
  .sort((a, b) => Number(a.id) - Number(b.id))
  .filter(s => s.id !== CURRENT_SEASON_ID) // current season stays live via fetchSchedule()

console.log("Men's regular seasons in the feed (excluding current):")
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
  if (!startYear) {
    console.warn(`\n${s.name}: could not parse a start year from the season name, skipping`)
    continue
  }

  // The schedule view takes `team`, not `team_id` — with team_id it quietly
  // ignores the filter and hands back the whole league's games instead of
  // erroring, per _achahistory.mjs's own hard-won comment on this.
  const rows = rowsOf(await get(`&view=schedule&season_id=${s.id}&team=${cal.id}`))
  const games = rows
    .map(entry => normalizeFeedRow(entry, startYear))
    .filter(Boolean)
    .sort((a, b) => a.sortDate - b.sortDate)

  console.log(`\n${s.name}: ${games.length} games`)
  if (!games.length) continue

  seasons.push({
    seasonId: s.id,
    seasonName: s.name,
    startYear,
    games: games.map((g, i) => ({ ...g, side: i % 2 === 0 ? 'left' : 'right' })),
  })
}

seasons.sort((a, b) => b.startYear - a.startYear) // newest-first, to match a season picker's natural order

await writeFile(
  path.join(dir, '../public/schedule-history.json'),
  JSON.stringify({ seasons }, null, 2),
  'utf8'
)
console.log(`\nWrote public/schedule-history.json (${seasons.length} seasons)`)

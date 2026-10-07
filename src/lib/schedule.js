import { loadJsonp } from './jsonp.js'

// TODO: this is ACHA's opaque season id, bump it manually each new season.
// scripts/fetch-schedule-history.mjs has a matching CURRENT_SEASON_ID to skip
// when it backfills past seasons — bump both together.
export const CURRENT_SEASON_ID = '73'
const FEED_URL =
  `https://lscluster.hockeytech.com/feed/index.php?feed=statviewfeed&view=schedule&team=241&season=${CURRENT_SEASON_ID}&month=-1&location=homeaway&key=e6867b36742a0c9d&client_code=acha&site_id=2&league_id=1&conference_id=9&division_id=57&lang=en`
const CAL_TEAM_ID = '241'
const OVERRIDES_URL = '/schedule-overrides.json'
const HISTORY_URL = '/schedule-history.json'
const LOGO_BASE_URL = 'https://assets.leaguestat.com/acha/logos'

const MONTHS = { // Note: -1 used for all months
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function ordinal(day) {
  if (day % 10 === 1 && day !== 11) return `${day}st`
  if (day % 10 === 2 && day !== 12) return `${day}nd`
  if (day % 10 === 3 && day !== 13) return `${day}rd`
  return `${day}th`
}

function inferSeasonStartYear(today = new Date()) {
  const month = today.getMonth() // 0-11
  return month >= 7 ? today.getFullYear() : today.getFullYear() - 1
}

export function currentSeasonStartYear() {
  return inferSeasonStartYear()
}

export function seasonLabel(startYear) {
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

// Exported so scripts/fetch-schedule-history.mjs can parse the same raw feed
// rows for past seasons, where seasonStartYear is known from the season
// itself rather than inferred from today's date.
export function normalizeFeedRow(entry, seasonStartYear) {
  const row = entry.row
  const prop = entry.prop

  const homeIsCal = prop?.home_team_city?.teamLink === CAL_TEAM_ID
  const visitingIsCal = prop?.visiting_team_city?.teamLink === CAL_TEAM_ID
  if (!homeIsCal && !visitingIsCal) {
    console.warn('Schedule feed row has no Cal team, skipping', row)
    return null
  }

  const opponentRaw = homeIsCal ? row.visiting_team_city : row.home_team_city
  const opponent = opponentRaw.replace(/^MD\d+\s+/, '')
  const opponentTeamId = homeIsCal ? prop?.visiting_team_city?.teamLink : prop?.home_team_city?.teamLink

  const dateMatch = /^\w+,\s*(\w+)\s+(\d+)/.exec(row.date_with_day || '')
  if (!dateMatch) {
    console.warn('Could not parse schedule feed date', row.date_with_day)
    return null
  }
  const monthIndex = MONTHS[dateMatch[1]]
  const day = parseInt(dateMatch[2], 10)
  const year = monthIndex >= 7 ? seasonStartYear : seasonStartYear + 1

  const timeMatch = /^(\d{1,2}):(\d{2})\s*([ap]m)/i.exec(row.game_status || '')
  let hour24 = 0
  let minute = 0
  let timeOnly = ''
  if (timeMatch) {
    hour24 = parseInt(timeMatch[1], 10) % 12
    minute = parseInt(timeMatch[2], 10)
    if (timeMatch[3].toLowerCase() === 'pm') hour24 += 12
    timeOnly = row.game_status.trim()
  }

  const sortDate = new Date(year, monthIndex, day, hour24, minute)

  const dateForDisplay = new Date(year, monthIndex, day)
  const weekday = dateForDisplay.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = dateForDisplay.toLocaleDateString('en-US', { month: 'long' })
  const dateText = `${weekday}, ${monthName} ${ordinal(day)}`
  const datetimeText = `${dateText}${timeOnly ? ` ${timeOnly}` : ''}`

  const homeGoals = row.home_goal_count
  const visitingGoals = row.visiting_goal_count
  const isPlayed = /^\d+$/.test(homeGoals) && /^\d+$/.test(visitingGoals)

  let scoreText = ''
  let usGoals = null
  let oppGoals = null
  if (isPlayed) {
    usGoals = parseInt(homeIsCal ? homeGoals : visitingGoals, 10)
    oppGoals = parseInt(homeIsCal ? visitingGoals : homeGoals, 10)
    scoreText = `Score: ${usGoals} - ${oppGoals}`
  }

  return {
    gameId: row.game_id,
    opponent,
    homeAway: homeIsCal ? 'H' : 'A',
    datetimeText,
    dateText,
    timeText: timeOnly,
    locationText: row.venue_name,
    scoreText,
    usGoals,
    oppGoals,
    watchUrl: '',
    logo: opponentTeamId ? `${LOGO_BASE_URL}/${opponentTeamId}.png` : undefined,
    sortDate,
    isPlayed,
  }
}

function normalizeOpponent(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function opponentsMatch(a, b) {
  const na = normalizeOpponent(a)
  const nb = normalizeOpponent(b)
  return na.length > 3 && nb.length > 3 && (na.includes(nb) || nb.includes(na))
}

function sameCalendarDate(game, isoDateStr) {
  const d = game.sortDate
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return iso === isoDateStr
}

function applyOverrides(games, overrides) {
  for (const override of overrides) {
    const matches = games.filter(
      g => sameCalendarDate(g, override.matchDate) && opponentsMatch(g.opponent, override.matchOpponent)
    )

    if (matches.length === 1) {
      const game = matches[0]
      if (override.watchUrl) game.watchUrl = override.watchUrl
      if (override.logo) game.logo = override.logo
      if (override.scoreText) game.scoreText = override.scoreText
      if (override.datetimeText) game.datetimeText = override.datetimeText
      if (override.locationText) game.locationText = override.locationText
      continue
    }

    if (matches.length > 1) {
      console.warn('Schedule override matched multiple games, skipping', override)
      continue
    }

    if (!override.opponent || !override.datetimeText || !override.locationText) {
      console.warn('Schedule override has no feed match and is missing required fields, skipping', override)
      continue
    }

    games.push({
      gameId: `override-${override.matchOpponent}-${override.matchDate}`,
      opponent: override.opponent,
      datetimeText: override.datetimeText,
      locationText: override.locationText,
      scoreText: override.scoreText || '',
      watchUrl: override.watchUrl || '',
      logo: override.logo || undefined,
      sortDate: new Date(`${override.matchDate}T00:00:00`),
      isPlayed: false,
    })
  }
}

// Full season slab (overall/home/away record, streak, goals, games played),
// same breakdown as the reference site's schedStats().
export function seasonStats(games) {
  const decided = games.filter(g => g.isPlayed && g.usGoals != null && g.oppGoals != null)
  let w = 0, l = 0, t = 0, gf = 0, ga = 0
  let hw = 0, hl = 0, ht = 0, aw = 0, al = 0, at = 0, unsided = 0

  for (const g of decided) {
    gf += g.usGoals
    ga += g.oppGoals
    const home = g.homeAway === 'H'
    const away = g.homeAway === 'A'
    if (!home && !away) unsided++
    if (g.usGoals > g.oppGoals) { w++; if (home) hw++; else if (away) aw++ }
    else if (g.usGoals < g.oppGoals) { l++; if (home) hl++; else if (away) al++ }
    else { t++; if (home) ht++; else if (away) at++ }
  }

  const played = w + l + t
  const pct = played ? (w + 0.5 * t) / played : 0

  let streak = '—'
  if (decided.length) {
    const tag = g => (g.usGoals > g.oppGoals ? 'W' : g.usGoals < g.oppGoals ? 'L' : 'T')
    const last = tag(decided[decided.length - 1])
    let n = 0
    for (let i = decided.length - 1; i >= 0 && tag(decided[i]) === last; i--) n++
    streak = `${last}${n}`
  }

  return {
    w, l, t, gf, ga, pct, streak, gp: played,
    home: unsided === played ? '—' : `${hw}-${hl}${ht ? `-${ht}` : ''}`,
    away: unsided === played ? '—' : `${aw}-${al}${at ? `-${at}` : ''}`,
  }
}

// Past seasons, backfilled offline by scripts/fetch-schedule-history.mjs
// (the ACHA feed only goes back to 2021-22 — see that script's header).
// Returns [] if the file hasn't been generated yet.
export async function fetchSeasonHistory() {
  const res = await fetch(HISTORY_URL, { cache: 'no-store' })
  if (!res.ok) return []
  const data = await res.json()
  return (data.seasons || []).map(season => ({
    ...season,
    games: season.games.map(g => ({ ...g, sortDate: new Date(g.sortDate) })),
  }))
}

export async function fetchSchedule() {
  const [feedResult, overridesResult] = await Promise.allSettled([
    loadJsonp(FEED_URL),
    fetch(OVERRIDES_URL, { cache: 'no-store' }).then(res => (res.ok ? res.json() : { overrides: [] })),
  ])

  if (feedResult.status === 'rejected') {
    throw new Error('Could not load schedule')
  }

  const rows = feedResult.value?.[0]?.sections?.[0]?.data ?? []
  const seasonStartYear = inferSeasonStartYear()
  const feedGames = rows
    .map(entry => normalizeFeedRow(entry, seasonStartYear))
    .filter(Boolean)

  if (overridesResult.status === 'rejected') {
    console.warn('Could not load schedule overrides; continuing without them')
  }
  const overrides = overridesResult.status === 'fulfilled' ? overridesResult.value.overrides || [] : []

  applyOverrides(feedGames, overrides)
  feedGames.sort((a, b) => a.sortDate - b.sortDate)

  return feedGames.map((game, i) => ({ ...game, side: i % 2 === 0 ? 'left' : 'right' }))
}

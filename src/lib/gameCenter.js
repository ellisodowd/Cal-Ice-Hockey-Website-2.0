import { loadJsonp } from './jsonp.js'

const KEY = 'e6867b36742a0c9d'
const BASE = 'https://lscluster.hockeytech.com/feed/index.php?feed=statviewfeed'
  + `&key=${KEY}&site_id=2&client_code=acha&lang=en&league_id=1`
const CAL_TEAM_ID = 241

// Normalizes a raw gameSummary response so every caller can just read
// `us`/`them` instead of juggling home/visiting each time.
export async function fetchGameSummary(gameId) {
  const data = await loadJsonp(`${BASE}&view=gameSummary&game_id=${gameId}`)
  const homeIsCal = Number(data?.homeTeam?.info?.id) === CAL_TEAM_ID
  const rawUs = homeIsCal ? data.homeTeam : data.visitingTeam
  const them = homeIsCal ? data.visitingTeam : data.homeTeam
  // The feed's own name/nickname/logo for Cal are generic ("University of
  // California-Berkeley" / "Bears" / a gold crest) — the site's own identity
  // wins here instead.
  const us = { ...rawUs, info: { ...rawUs.info, name: 'California', nickname: 'Golden Bears', logo: null } }
  return { ...data, us, them, usIsHome: homeIsCal }
}

// Every goal across every period, in chronological order, with a running
// score and which side (us/them) scored — everything the scoring list,
// Quick Look and the play-by-play tab need, computed once.
export function scoringPlays(summary) {
  let usScore = 0
  let themScore = 0
  const plays = []
  for (const period of summary.periods || []) {
    for (const goal of period.goals || []) {
      const isUs = Number(goal.team?.id) === CAL_TEAM_ID
      if (isUs) usScore++
      else themScore++
      plays.push({
        ...goal,
        periodId: period.info?.id,
        periodLabel: period.info?.longName || period.info?.shortName,
        isUs, usScore, themScore,
      })
    }
  }
  return plays
}

// The periods that actually had goals, in the order they occurred — built
// from the plays themselves rather than a hardcoded ['1','2','3','OT','SO']
// list, so it can't drift out of step with however the feed names a period.
export function periodsWithPlays(plays) {
  const groups = []
  for (const play of plays) {
    const last = groups[groups.length - 1]
    if (last && last.periodId === play.periodId) last.plays.push(play)
    else groups.push({ periodId: play.periodId, label: play.periodLabel, plays: [play] })
  }
  return groups
}

// Every penalty across every period, in chronological order.
export function penaltyPlays(summary) {
  const plays = []
  for (const period of summary.periods || []) {
    for (const penalty of period.penalties || []) {
      const isUs = Number(penalty.againstTeam?.id) === CAL_TEAM_ID
      plays.push({
        ...penalty,
        periodId: period.info?.id,
        periodLabel: period.info?.longName || period.info?.shortName,
        isUs,
      })
    }
  }
  return plays
}

// Goals and penalties together, in one chronological list, each tagged with
// its own `kind` — what a real play-by-play log actually is. The feed has
// no shots/faceoffs/stoppages, so those kinds just don't appear; nothing
// here invents them.
function clockSeconds(time) {
  const m = /^(\d+):(\d{2})/.exec(time || '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0
}

export function allPlays(summary) {
  const goals = scoringPlays(summary).map(p => ({ ...p, kind: 'goal' }))
  const penalties = penaltyPlays(summary).map(p => ({ ...p, kind: 'penalty' }))
  return [...goals, ...penalties].sort((a, b) => {
    const byPeriod = Number(a.periodId) - Number(b.periodId)
    if (byPeriod) return byPeriod
    // The clock counts down within a period, so more time left means earlier.
    return clockSeconds(b.time) - clockSeconds(a.time)
  })
}

export function strengthTag(goal) {
  if (goal.properties?.isPowerPlay === '1') return 'PPG'
  if (goal.properties?.isShortHanded === '1') return 'SHG'
  if (goal.properties?.isEmptyNet === '1') return 'EN'
  return null
}

# Cal Ice Hockey — Website

Public website for the UC Berkeley (Cal) ice hockey team. Roster, schedule,
staff, and articles. Built as a **fully static** React app — no backend, no
database, no server-side code.

> **Team operations** (lines builder, availability, announcements, login) do
> **not** live in this repo. They are moving to a separate **Expo app** backed
> by Supabase. See [Team Ops App](#team-ops-app-future) below.

---

## Tech stack

| Layer    | Choice                                  |
| -------- | --------------------------------------- |
| UI       | React 18 + React Router 6               |
| Build    | Vite 5                                  |
| Hosting  | HostGator (shared cPanel, static files) |
| Domain   | Porkbun (registrar)                     |
| Content  | Static JSON (`*.json`) read at runtime  |

All page content lives in JSON files at the repo root (`roster-data.json`,
`schedule.json`, `staff.json`, `articles.json`, `players.json`) and is fetched
by the React pages. Editing content = editing those files + a redeploy.

---

## Local development

Requires **Node 18+**.

```bash
npm install        # install dependencies
npm run dev        # start dev server (also exposed on your LAN for phone testing)
npm run build      # production build → ./dist
npm run preview    # serve the production build locally to sanity-check it
```

`dist/` is the build output. It is **git-ignored** — never commit it. CI
rebuilds it on every deploy.

---

## Schedule & score overrides

The live Schedule page (and the homepage's Scoreboard ticker) pull from the
ACHA/HockeyTech feed directly in the browser (`src/lib/schedule.js`). That
feed is sometimes wrong, incomplete, or just slow to update after a game.
`public/schedule-overrides.json` lets you patch individual games on top of
whatever the feed says, without touching code — just edit the file and
deploy (push to `main`) like any other content change.

Each entry matches an existing game by **`matchDate`** (`YYYY-MM-DD`, the
game's calendar date) and **`matchOpponent`** (a partial, case-insensitive
match against the opponent's name — `"San Jose State"` matches `"San Jose
State University"`). If exactly one game matches, these fields can be
overridden:

| Field          | Overrides                                                        |
| -------------- | ----------------------------------------------------------------- |
| `watchUrl`     | The "Watch" link/button                                           |
| `logo`         | The opponent's logo image                                         |
| `datetimeText` | The displayed date/time (e.g. feed has the wrong time)            |
| `locationText` | The displayed venue                                               |
| `usGoals`, `oppGoals` | The final score — see **Score overrides** below           |

**Score overrides** — use this when a game has actually happened but ACHA
hasn't posted a score to the feed yet (the feed still shows it as
upcoming). Set both `usGoals` (Cal's goals) and `oppGoals` (the opponent's):

```json
{
  "matchDate": "2026-10-23",
  "matchOpponent": "San Jose State University",
  "usGoals": 4,
  "oppGoals": 1
}
```

Setting both marks the game as played everywhere that reads game data —
the Schedule page's score and W/L tag, the homepage ticker, and the
season record/streak — not just a cosmetic label. A `scoreText` string
(e.g. `"Score: 4 - 1"`) is derived automatically; only set `scoreText`
yourself if you want different wording.

**If the game isn't on the schedule feed at all yet**, the override can
create a new entry instead of patching one — in that case `opponent`,
`datetimeText`, and `locationText` are required (so there's enough to
display), and `usGoals`/`oppGoals` are still optional on top of that:

```json
{
  "matchDate": "2026-11-21",
  "matchOpponent": "University of Nevada-Reno",
  "opponent": "University of Nevada-Reno",
  "datetimeText": "Saturday, November 21st 7:00 PM PST",
  "locationText": "@Reno Ice"
}
```

`matchDate`/`matchOpponent` still have to be set — they're what a future
override (or the feed, once ACHA adds the game) would match against — but
since there's no feed row to patch yet, `opponent`, `datetimeText`, and
`locationText` repeat/supply the actual display values directly. Add
`usGoals`/`oppGoals` the same way as above once the game's been played and
still isn't in the feed.

**Cleanup:** once ACHA's feed catches up and reports the real score for
that date+opponent, the live feed data takes over again automatically —
an override entry doesn't need to be removed for the site to be correct,
but it's good housekeeping to delete it once it's redundant.

---

## DevOps / Deployment

### Overview

```
git push to `main`
      │
      ▼
GitHub Actions  --npm run build-->  uploads ./dist over FTP
      │
      ▼
HostGator public_html/  (Apache serves the static files)
      ▲
      │ DNS (calicehockey.com)
   Porkbun (domain registrar)
```

The site auto-deploys: **every push to `main` → production deploy** via the
GitHub Actions workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### HostGator (FTP auto-deploy)

Every push to the **`main`** branch builds the site in GitHub Actions and uploads
the `dist/` output to HostGator over FTP. Config lives in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). You can also run
it manually from the repo's **Actions** tab (**Run workflow**) for testing.

**Required repo secrets** (GitHub → Settings → Secrets and variables → Actions):

| Secret         | Value                                                        |
| -------------- | ----------------------------------------------------------- |
| `FTP_SERVER`   | FTP hostname from cPanel → FTP Accounts → "Configure FTP Client" |
| `FTP_USERNAME` | the full `user@domain` string for the FTP account           |
| `FTP_PASSWORD` | that FTP account's password                                 |

**First-time setup (repo owner, one time):**

1. cPanel → **FTP Accounts** → create an account with its directory scoped to
   `public_html`.
2. "**Configure FTP Client**" → note the server hostname; the username is the
   full `user@domain` string.
3. Add the three secrets above in GitHub.
4. Clear old site files out of `public_html/` before the first run — the action
   syncs the build but won't remove unrelated leftovers.
5. Place `.htaccess` in `public_html/` (see **SPA routing** below).
6. Trigger the workflow from the **Actions** tab and watch the log.

**SPA routing / `.htaccess`:** this is a client-side-routed app, so a direct hit
to `/roster` on Apache 404s unless rewritten. A reference copy lives at
[`deploy/.htaccess`](deploy/.htaccess) — copy it into `public_html/` on the
server. It is **managed manually on the server** and deliberately **excluded from
the deploy**, so CI never overwrites or deletes it.

### Player stats auto-refresh

The Stats page reads a static file, `public/player-stats.json`, built by
[`scripts/fetch-player-stats.mjs`](scripts/fetch-player-stats.mjs) from the
ACHA/HockeyTech feed (same feed the live Schedule page uses). **This no
longer needs to be run and committed by hand.** The deploy workflow now runs
it fresh before every build:

- Every push to `main` refreshes stats, then builds and deploys.
- It also runs **on a schedule** (`cron` in
  [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), currently
  8am/4pm UTC) so stats stay current even on weeks with no code changes —
  e.g. the morning after a weekend game. To change how often it checks, edit
  that cron line.
- Need stats updated *right now* (e.g. right after a game)? Go to the repo's
  **Actions** tab → "Deploy to HostGator" → **Run workflow**.

**Why this isn't fetched live in the visitor's browser instead:** for the
current season alone, building the stats requires one feed call per
*finished game* (15–30+ calls a season), on top of all past seasons' data
which never changes. Doing that in every visitor's browser on every page
load would be slow and would hammer a third-party feed we don't control —
risking it rate-limiting or blocking the shared API key, which would also
break the live Schedule page. Running it once in CI and serving a small
static JSON file is what keeps the site fast.

**If stats look stale:** check the latest "Deploy to HostGator" run in the
Actions tab — the fetch step is allowed to fail without blocking the
deploy (`continue-on-error`), so a flaky feed just means that run's deploy
goes out with the previous data instead of crashing. Expand the "Refresh
player stats from ACHA feed" step's logs to see why it failed (feed
down, API key/URL changed, a season's shape changed, etc.).

The copy of `public/player-stats.json` committed in git is just a fallback
seed for local dev (`npm run dev` without ever running the fetch script) —
it's no longer the source of truth for production and doesn't need to be
kept current by hand.

### Domain (Porkbun → HostGator)

The domain **calicehockey.com** is registered at **Porkbun** and points at the
HostGator server. In cPanel the site is served from `public_html/`. If the domain
ever needs re-pointing, use the A record / nameservers HostGator provides for the
account (cPanel → **Server Information** for the shared IP) and set them in
Porkbun's DNS.

> **Legacy note:** the site used to run a PHP login/OAuth layer on HostGator.
> That PHP is gone (the site is now fully static). If an old `config.php` still
> lives on the server, delete it — it held a Google OAuth client secret; consider
> rotating that secret in Google Cloud Console regardless.

---

## Accounts & credentials

Fill these in once confirmed so the next maintainer isn't locked out. **Do not
commit passwords or secrets** — store those in a password manager and reference
them here by name only.

| Service          | Account / email            | Notes                                  |
| ---------------- | -------------------------- | -------------------------------------- |
| HostGator        | `TODO: which account`      | Shared cPanel hosting; FTP deploy target (`public_html`). Plan: hand off account before graduation |
| Porkbun          | `TODO: which email/account`| Domain registrar for calicehockey.com  |
| GitHub repo      | `ellisodowd`               | Source; runs the FTP deploy workflow    |
| Google Cloud     | `ellisodowd.dev@gmail.com`  | OAuth client for Google sign-in; now used by the Expo app via Supabase. See the app repo for details. |

---

## Team Ops App (future)

The team-operations features are **not** part of this website. They are planned
as a separate **Expo (React Native)** app — possibly shipped as a PWA first —
because the core value is **push notifications + a home-screen presence** that a
website can't provide (the reason a website/Slack gets ignored).

Planned shape:

- **Expo app** — lines builder, availability, announcements, push notifications.
- **Supabase** — Google sign-in (replaces the old PHP OAuth), the team email
  allow-list + admin roles, and any persisted data (e.g. saved lines).
- **This website stays public and static** — no login. Recruits/parents never
  need to download an app to see the schedule or roster.

The old, now-removed PHP system (`login.php`, `callback.php`, the email
allow-list, and `lines-builder.php`) is the reference for what the Expo + Supabase
side needs to reproduce.

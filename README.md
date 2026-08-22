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

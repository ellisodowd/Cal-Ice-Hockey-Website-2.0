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
| Hosting  | Cloudflare Workers (static assets)     |
| Domain   | Porkbun (registrar) → Cloudflare (DNS)  |
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

`dist/` is the build output. It is **git-ignored** — never commit it. Cloudflare
rebuilds it on every deploy.

---

## DevOps / Deployment

### Overview

```
git push to `main`
      │
      ▼
Cloudflare Workers  --build-->  serves ./dist on the global CDN
      ▲
      │ DNS (calicehockey.com)
   Porkbun (domain registrar)
```

The site auto-deploys: **every push to `main` → production deploy.** Every push
to any other branch (or PR) → its own **preview URL** for testing before merge.
There is no CI config to maintain — it is built into Cloudflare Workers Builds.

> This project deploys as a **Cloudflare Worker serving static assets** (the
> current default flow), not classic Pages. The Worker config lives in
> [`wrangler.jsonc`](wrangler.jsonc) and the live URL is a `*.workers.dev`
> address.

### Cloudflare — first-time setup (done)

Recreate from scratch only if the project is ever deleted:

1. Cloudflare dashboard → **Workers & Pages → Create → import the Git repo**.
2. Authorize GitHub and select this repository.
3. Build/deploy configuration:
   | Field             | Value              |
   | ----------------- | ------------------ |
   | Production branch | `main`             |
   | Build command     | `npm run build`    |
   | Deploy command    | `npx wrangler deploy` |
4. The deploy reads [`wrangler.jsonc`](wrangler.jsonc), which points at `./dist`
   as static assets. The first build gives a `*.workers.dev` URL to verify.
5. Add the custom domain (see below).

> **Gotcha (already handled):** wrangler's Vite auto-detection requires Vite ≥ 6
> (we're on 5.4), so `wrangler.jsonc` configures the static-assets deploy
> explicitly to skip it. Don't remove that file.

### SPA routing

This is a single-page app using client-side routing. SPA fallback is configured
in [`wrangler.jsonc`](wrangler.jsonc):

```jsonc
"assets": { "directory": "./dist", "not_found_handling": "single-page-application" }
```

This serves `index.html` for unknown paths so deep links (e.g. `/roster`) and
refreshes work instead of 404ing.

> Note: do **not** add a `public/_redirects` file — Workers static assets rejects
> a `/* /index.html 200` rule as an infinite loop. `not_found_handling` is the
> Workers-native replacement.

### Domain (Porkbun → Cloudflare)

The domain **calicehockey.com** is registered at **Porkbun**. To point it at the
Worker, after the first deploy:

1. The Worker's project → **Settings → Domains & Routes → Add → Custom domain** →
   enter `calicehockey.com` (and `www`).
2. Cloudflare shows the DNS records (or nameservers) to use.
3. In **Porkbun**, either:
   - point the domain's **nameservers** to the ones Cloudflare gives you
     (recommended — lets Cloudflare manage DNS), **or**
   - add the **CNAME/A records** Cloudflare specifies if you keep DNS at Porkbun.
4. Wait for DNS to propagate; Cloudflare issues HTTPS automatically.

> **Tip:** Cloudflare Registrar sells domains at wholesale cost. If renewals get
> annoying you *could* transfer the domain from Porkbun to Cloudflare later, but
> it's optional — pointing DNS is enough.

### Cost

- **Hosting:** free on Cloudflare Workers (generous free tier, plenty of requests/month --
  far more than this site needs).
- **Domain:** the only recurring cost — the yearly Porkbun registration (~$10–15/yr).

### Retiring HostGator

The site used to run on HostGator with a PHP login/OAuth layer. That PHP is gone
(the site is now fully static), so HostGator is no longer needed. Once Cloudflare
is live and the domain points to it, the HostGator hosting plan can be cancelled.
If anything still lives on the HostGator server, also delete the old
`config.php` (it held a Google OAuth client secret — consider rotating that
secret in Google Cloud Console regardless).

---

## Accounts & credentials

Fill these in once confirmed so the next maintainer isn't locked out. **Do not
commit passwords or secrets** — store those in a password manager and reference
them here by name only.

| Service          | Account / email            | Notes                                  |
| ---------------- | -------------------------- | -------------------------------------- |
| Cloudflare       | `TODO: which email/account`| Hosting + (optionally) DNS             |
| Porkbun          | `TODO: which email/account`| Domain registrar for calicehockey.com  |
| GitHub repo      | `ellisodowd`               | Source; connected to Cloudflare Workers |
| HostGator        | `TODO: legacy`             | Old host — cancel after cutover        |
| Google Cloud     | `TODO: OAuth project owner`| Old OAuth app; reused by the Expo app  |

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

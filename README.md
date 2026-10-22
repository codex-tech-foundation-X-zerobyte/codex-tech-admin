# codex-admin

Internal admin console for Codex (React + TypeScript + Vite, Supabase). Strictly an admin monitoring tool. Deploy on its own `admin.` subdomain. Part of `codex-tech-main-build`.

## Pages
Overview (counts, 14-day chart, language and provider breakdown, recent signups), Waitlist (search, filters, server-side pagination, status changes, delete with confirm, CSV export that neutralises spreadsheet formulas), Team and roles (super admin only), Audit log (super admin and admin).
Roles: **super_admin** (everything), **admin** (waitlist edits, exports, audit log), **viewer** (read only).
The sidebar lists Monitor and Mail as "not yet shipped"; new modules add their admin pages as they ship.

## Setup
1. Run the SQL in `../codex-tech-developers-platform/supabase/` (README there): migrations 0001 and 0002, then create the first user and run `seed_super_admin.sql`.
2. `cp .env.example .env.local` and fill in the Supabase URL and **anon** key. Never use the service-role key here.
3. `npm install`, `npm run dev`, sign in with the super admin account.
4. `npm test` and `npm run build` should both pass.

## How access is enforced
The browser never reads tables. Every read and write goes through database functions that check the signed-in user's role (tested with local SQL role tests in the platform repo). Hiding a button in the UI is convenience only.
Adding an admin requires that the person already has a Supabase account (create it in Authentication > Users). An invite-by-email flow needs a server-side function and is a later slice.

## Deploy
Vercel: import the private repo, preset Vite, build `npm run build`, output `dist` (set in `vercel.json`), add the two `VITE_` variables. `vercel.json` sets security headers and `X-Robots-Tag: noindex`. Put it on an `admin.` subdomain and consider Vercel's deployment protection or a second lock in front of it.

## Not done yet
Signup detail drawer, mobile table cards, edge rate limiting on sign in, email invites, the final logo (a working mark is in place; master copy in `../branding/`).
Note: the design's "Channel joins" card is replaced by "Removal requests", because WhatsApp and Telegram do not report joins to us.

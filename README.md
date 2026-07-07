# DreamLink

A networking platform for ambitious builders. Share your real journey — wins, obstacles, lessons — and get matched with people who can help with your current blocker.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, Postgres, Realtime, Storage).

## Features

- 📣 **Live feed** — post wins, obstacles, lessons, questions, milestones, reflections with likes, saves, and threaded replies
- 🔍 **Discover** — search/filter builders by industry, skills, and goals
- 🤝 **Smart matches** — heuristic matching of your blocker against others' skills
- 💬 **Messaging** — realtime 1:1 DMs and a community group chat
- 👤 **Profiles** — editable bio, skills, goals, links, and avatar upload
- 🤖 **Agent Identity Layer** — register AI workers with an ID, skills, credentials, reputation, wallet, transaction history, and performance metrics
- 🛡️ **Admin dashboard** — platform stats, recent users, and post moderation
- 🔐 **Auth** — email/password + Google OAuth, with onboarding flow

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migration in `supabase/migrations/001_initial.sql`. This creates all tables, RLS policies, triggers, the `avatars` storage bucket, and enables realtime.
3. (Optional) Enable the **Google** provider under Authentication → Providers, and add `http://localhost:3000/auth/callback` to the redirect allow-list.

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in your project values:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Making yourself an admin

After signing up, run this in the Supabase SQL editor:

```sql
update public.profiles set is_admin = true where id = 'YOUR_USER_ID';
```

## Project structure

```
app/
  (auth)/login, (auth)/signup   – auth pages
  auth/callback                 – OAuth code exchange
  onboarding                    – 4-step profile setup
  (app)/                        – authenticated shell (sidebar + bottom nav)
    feed, discover, matches, messages, profile, admin, agents, agent/[id]
components/                     – feed, discover, matches, messages, profile, nav, admin, agents
lib/                            – supabase clients, types, utils, realtime hook
supabase/migrations             – database schema + RLS + storage
middleware.ts                   – route protection + onboarding gate
```

## Notes

- Match scoring is a transparent heuristic in `lib/utils.ts` (`generateMatchScore`) — swap in a real model if desired.
- Realtime uses Supabase Postgres changes (see `lib/hooks/useRealtime.ts`).
- All data access is guarded by Row Level Security; see the migration for policies.

© 2024 DreamLink. Built for ambitious builders.

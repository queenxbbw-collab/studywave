# StudyWave — International Q&A Platform

## Overview

StudyWave is a Brainly-like Q&A platform for students with: user accounts, JWT auth, questions/answers, voting, award system (Gold Ribbon for best answer), points, badges, user profiles, leaderboard, feature suggestions system, and a full admin panel. White/indigo enterprise design with Plus Jakarta Sans font. Fully in English.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Architecture

- **Frontend**: `artifacts/studywave` — React + Vite + Tailwind + shadcn/ui (dark theme), wouter for routing
- **Backend**: `artifacts/api-server` — Express 5, JWT auth, REST API on port 8080
- **Database**: PostgreSQL + Drizzle ORM (tables: users, badges, userBadges, questions, questionVotes, answers, answerVotes, activity)
- **API Client**: `lib/api-client-react` — generated React Query hooks via Orval from OpenAPI spec

## Auth

- JWT stored in localStorage as `studywave_token`
- `setAuthTokenGetter(() => localStorage.getItem("studywave_token"))` in App.tsx
- Admin: admin@studywave.com / admin123 (only admin account)
- Test user: alex@studywave.com / user123

## Key Features

- Questions with subject filter, search, sort, pagination
- **Image URLs**: Up to 5 image URLs per question (stored as JSON in `image_urls` column), displayed inline
- Answers with voting (upvote/downvote) 
- Award system: question author can award ONE answer with Gold Ribbon (+50pts to answerer, min 5 min wait)
- Points: ask=+5, answer=+10, award=+50
- Badges auto-assigned on point thresholds
- Leaderboard with gradient hero, podium display, "Suggest a Feature" modal
- Feature suggestions: users submit from Leaderboard, admin reviews in Suggestions tab
- Admin panel: 7 tabs — Stats (with recharts BarChart/PieChart), Users, Questions, Badges, Reports, Announcements, Suggestions
- Streak system: daily_streak, longest_streak tracked per user, displayed on profile
- Bookmarks, Comments on answers, Notifications bell with dropdown
- Markdown editor + renderer for questions/answers
- View count on questions (auto-incremented on GET)

## Anti-Abuse Rules

- **Daily question limit**: 5 questions/day per user (HTTP 429 if exceeded)
- **Daily answer limit**: 15 answers/day per user (HTTP 429 if exceeded)
- **Min title length**: 15 characters
- **Min content length**: 50 characters
- **Min answer length**: 30 characters
- **No self-answering**: Users cannot answer their own questions
- **No duplicate answers**: One answer per user per question; edit existing instead
- **No self-voting**: Users cannot vote on their own questions or answers
- **Gold Ribbon cooldown**: Question must be at least 5 minutes old before awarding
- **No self-awarding**: Question author cannot award their own answer
- **`GET /api/my-limits`**: Returns daily usage counts and remaining quota for logged-in user

## Pages

- `/` — HomePage with stats, search, subject filter, activity feed
- `/login`, `/register` — auth pages
- `/questions` — paginated list with filters/sort
- `/questions/:id` — detail with voting, award button, answer form
- `/ask` — create question form
- `/profile/:id` — user profile with stats, badges, questions, answers tabs
- `/settings` — edit profile, avatar URL, change password
- `/leaderboard` — top users ranking
- `/badges` — all badges grouped by category
- `/admin` — admin-only panel

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

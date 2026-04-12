# StudyWave — International Q&A Platform

## Overview

StudyWave is a Brainly-like Q&A platform for students with: user accounts, JWT auth, questions/answers, voting, award system ("fundița de aur"/ribbon for best answer), points, badges, user profiles, leaderboard, and a full admin panel. Dark navy+purple theme with Plus Jakarta Sans font.

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
- Answers with voting (upvote/downvote) 
- Award system: question author can award ONE answer with "fundița de aur" (+50pts to answerer)
- Points: ask=+5, answer=+10, award=+50
- Badges auto-assigned on point thresholds
- Leaderboard with podium display
- Admin panel: stats, user management (block/unblock), question moderation, badge CRUD

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

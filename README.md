# Personalized Content Dashboard

A modern, responsive Next.js dashboard for personalized news, movie recommendations, and social content, with a real database-backed authentication flow.

## Project Overview

This application provides a polished dashboard experience with secure authentication, category-based personalization, favorites management, trending views, debounced search, drag-and-drop feed reordering, and a persistent theme. The application is designed for local development and can be connected to a production database when needed.

## Features

- Secure register + login flow
- Real database-backed user accounts using Prisma
- Password hashing with bcrypt
- HTTP-only session cookies for authenticated access
- Protected routes for dashboard and all content sections
- Responsive sidebar and mobile navigation
- Personalized feed with category preferences
- Search, favorites, dark mode, trending, and drag-and-drop reordering
- LocalStorage persistence, namespaced by user, for UI state
- Fallback mock content when external APIs are unavailable

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Redux Toolkit
- Framer Motion
- @dnd-kit/core
- Prisma ORM
- SQLite for local development and Neon PostgreSQL in production
- bcryptjs + jose for password hashing and sessions
- Jest + Testing Library
- Playwright

## Architecture

- App Router structure in Next.js
- Prisma models for User, Preference, Favorite, and FeedConfig
- Server-side route handlers for auth operations
- Middleware-based route protection for authenticated views
- Redux slices for dashboard state and UI features

## Folder Structure

```text
personalized-content-dashboard/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── schema.sqlite.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── dashboard/
│   │   ├── feed/
│   │   ├── favorites/
│   │   ├── login/
│   │   ├── register/
│   │   ├── settings/
│   │   ├── trending/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   ├── data/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
├── e2e/
├── .env.example
├── .env
├── .gitignore
├── middleware.ts
├── package.json
├── README.md
├── REQUIREMENTS_CHECKLIST.md
└── prisma/dev.db
```

## Prerequisites

- Node.js 20.9+
- npm
- SQLite is used for local development; Vercel deployments use Neon PostgreSQL

## Installation

```bash
npm install
Copy-Item .env.example .env
npm run db:push:sqlite
```

In shells without `Copy-Item`, use the equivalent command to copy `.env.example` to `.env`.

## Environment Variables

Local `.env` values (SQLite):

```env
DATABASE_URL="file:./dev.db"
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="replace-with-a-random-secret-at-least-32-characters-long"
NEXT_PUBLIC_NEWS_API_KEY=""
NEXT_PUBLIC_TMDB_API_KEY=""
```

The default Prisma schema targets PostgreSQL for production. The install step generates a local SQLite Prisma
Client from `prisma/schema.sqlite.prisma`, which is used by local development and tests. The local `DIRECT_URL`
value is only a placeholder; the SQLite schema does not use it.

## Database Setup

```bash
npm run db:generate:sqlite
npm run db:push:sqlite
```

This creates the SQLite database for local development and initializes the authentication schema.

## Running the Application

```bash
npm run dev
```

Open http://localhost:3000.

## User Flow

1. User visits the app and is redirected to /login.
2. User creates an account at /register.
3. Account is validated and saved to the Prisma database with a hashed password.
4. User logs in and receives an authenticated session.
5. Protected pages redirect unauthenticated users to /login.
6. After login, the user can access the dashboard and personalized views.
7. Logout invalidates the session and blocks access to protected routes.

## Running Tests

### Unit and Integration Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## Production Build

```bash
npm run build
```

## Deploy to Vercel with Neon

1. Create a Neon project and copy both connection strings from its dashboard:
   - `DATABASE_URL`: the pooled connection string for application queries.
   - `DIRECT_URL`: the direct (unpooled) connection string for Prisma migrations.
   Keep both values private and enable SSL (`sslmode=require`).
2. In Vercel, create/import the project. When this dashboard folder is the repository root, set **Root Directory**
   to `.` (the default). Only set it to `personalized-content-dashboard` if you imported a parent repository that
   contains this folder. The included `vercel.json` selects Next.js and runs `npm run vercel-build`, which
   generates Prisma Client, applies checked-in migrations, and builds the app.
3. Before deploying, add these environment variables in Vercel under **Project Settings → Environment Variables**
   for both Production and Preview. Use a separate Neon database/branch for Preview. `DIRECT_URL` is required:
   Prisma reads it from `prisma/schema.prisma` during `prisma generate` and `prisma migrate deploy`; if it is
   missing from the Vercel build environment, the build fails with P1012.

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled PostgreSQL URL (`sslmode=require`; use the pooled endpoint) |
   | `DIRECT_URL` | Neon direct/unpooled PostgreSQL URL (`sslmode=require`) |
   | `JWT_SECRET` | A private random value of at least 32 characters |

   `NEXT_PUBLIC_NEWS_API_KEY` and `NEXT_PUBLIC_TMDB_API_KEY` are optional; the app uses fallback content when absent.
   Generate `JWT_SECRET` locally (for example, with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`)
   and enter it directly in Vercel's environment-variable settings.
4. In a terminal opened at the dashboard project root, link it to the Vercel project, and deploy:

   ```bash
   npx vercel
   npx vercel --prod
   ```

   Complete the prompts to link the Vercel project. Confirm the Vercel project Root Directory is
   `.` when this project folder is the repository root (or `personalized-content-dashboard` when deploying from a
   parent repository), and that its Build Command is `npm run vercel-build`. The command generates the PostgreSQL
   Prisma Client, applies the
   committed migrations using `DIRECT_URL`, then builds Next.js. Do not put database URLs or `JWT_SECRET` in
   source files or command-line arguments.

The deployed database starts empty; local SQLite records are not automatically copied to Neon. Authentication,
password hashing, session cookies, and the existing Prisma models remain in place.

## Live Demo

A production demo URL can be added after deployment to Vercel or another hosting platform.

## Known Limitations

- SQLite is used for local development convenience; production should prefer PostgreSQL.
- Live API keys are optional and the app falls back to realistic mock data if they are missing.

## Future Improvements

- More advanced personalization algorithms
- Role-based access control
- Social login providers
- Improved analytics and usage tracking

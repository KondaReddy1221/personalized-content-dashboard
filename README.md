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
- SQLite for local development (PostgreSQL-ready schema)
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
│   └── schema.prisma
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

- Node.js 18+
- npm
- SQLite is used by default for local development

## Installation

```bash
npm install
cp .env.example .env
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_NEWS_API_KEY=""
NEXT_PUBLIC_TMDB_API_KEY=""
```

For production PostgreSQL, update the Prisma datasource provider and use a PostgreSQL connection string instead.

## Database Setup

```bash
npx prisma generate
npx prisma db push
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

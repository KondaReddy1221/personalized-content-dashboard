# Requirements Checklist

## Authentication Requirements

| Requirement | Implemented | File/Location | Verification |
| --- | --- | --- | --- |
| Register page | Yes | src/app/register/page.tsx | Client-side form with validation |
| Login page | Yes | src/app/login/page.tsx | Client-side login flow |
| Real database storage | Yes | prisma/schema.prisma | Prisma SQLite database for user records |
| Password hashing | Yes | src/app/api/auth/register/route.ts | bcrypt password hash before save |
| Duplicate email prevention | Yes | src/app/api/auth/register/route.ts | Duplicate check before create |
| Unregistered login handling | Yes | src/app/api/auth/login/route.ts | Returns `Account not found. Please register first.` |
| Wrong password handling | Yes | src/app/api/auth/login/route.ts | Returns `Invalid email or password.` |
| Session creation | Yes | src/lib/auth.ts | Signed JWT cookie created on login |
| Protected routes | Yes | middleware.ts | Redirects unauthenticated requests to /login |
| Redirect authenticated users away from auth pages | Yes | middleware.ts | Redirects /login and /register to /dashboard |
| Logout | Yes | src/app/api/auth/logout/route.ts | Clears session and redirects to /login |
| User-scoped localStorage state | Yes | src/features/theme/themeSlice.ts, src/features/preferences/preferencesSlice.ts, src/features/favorites/favoritesSlice.ts, src/features/feed/feedSlice.ts | Namespaced by authenticated user ID |
| Authenticated dashboard access | Yes | src/app/dashboard/page.tsx | Redirects unauthenticated users |

## Dashboard Requirements

| Requirement | Implemented | File/Location | Verification |
| --- | --- | --- | --- |
| Personalized feed | Yes | src/components/dashboard/DashboardApp.tsx | Feed cards, reorder, load more, mock data |
| User preferences | Yes | src/features/preferences/preferencesSlice.ts | Redux state plus namespaced localStorage persistence |
| News API fallback | Yes | src/services/contentService.ts | Uses live key if set; falls back to mock data |
| Movie API fallback | Yes | src/services/contentService.ts | Uses TMDB if key is set; otherwise mock data |
| Social mock API | Yes | src/data/mockData.ts | Social feed seeded in mock data |
| Favorites | Yes | src/features/favorites/favoritesSlice.ts | Toggle and persist favorites |
| Trending | Yes | src/components/dashboard/DashboardApp.tsx | Trending cards section |
| Search | Yes | src/utils/search.ts | Search logic across news, movies, and social |
| Debounced search | Yes | src/hooks/useDebounce.ts | 400ms debounce behavior |
| Drag and drop ordering | Yes | src/components/dashboard/DashboardApp.tsx | DnD kit reorder of feed cards |
| Dark mode | Yes | src/features/theme/themeSlice.ts | Theme toggle persisted in localStorage |
| Redux Toolkit | Yes | src/store/store.ts | Store config with slices |
| API async handling | Yes | src/features/feed/feedSlice.ts | Async feed loading with status handling |
| LocalStorage persistence | Yes | all slice files | Favorites, feed, preferences, theme |
| Unit tests | Yes | src/__tests__/reducers.test.ts | Preference, favorites, theme, debounce, search |
| Integration tests | Yes | src/__tests__/dashboard.test.tsx | Dashboard rendering and search/favorites |
| E2E tests | Yes | e2e/dashboard.spec.ts | Playwright smoke test |
| Responsive UI | Yes | src/components/dashboard/DashboardApp.tsx | Breakpoint-based layout and mobile drawer |
| Accessibility | Yes | src/components/dashboard/DashboardApp.tsx | Labels, roles, focus-friendly buttons |

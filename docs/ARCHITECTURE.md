# Memora — Architecture

## Overview

Memora is a single-page application (SPA) built with React 19 and Vite. It uses Supabase as its backend-as-a-service for authentication, database, and file storage, and calls the Groq API directly from the browser for AI transcription and analysis. There is no custom server layer.

```
Browser
  └── React SPA (Vite)
        ├── Supabase (Auth · PostgreSQL · Storage)
        └── Groq API (Whisper transcription · LLaMA analysis)
```

---

## Directory Structure

```
src/
├── assets/           # Static assets (logo, images)
├── components/
│   ├── common/       # Shared presentational components (EmptyState, PageHeader, etc.)
│   ├── layouts/      # Structural shell components (AppLayout, AuthLayout, Header)
│   └── ui/           # shadcn/ui primitives (Button, Dialog, Badge, etc.)
├── config/
│   ├── app.ts        # Global constants (upload limits, pagination, feature flags)
│   └── routes.ts     # Centralized route path constants
├── context/          # (reserved — global state lives in providers/)
├── features/         # Feature modules (see below)
├── hooks/            # Global utility hooks (useAuth, useDebounce, useLocalStorage, useMediaQuery)
├── lib/
│   ├── supabase.ts   # Typed Supabase client singleton
│   ├── query-client.ts # TanStack Query client configuration
│   └── utils.ts      # cn() and other shared utilities
├── providers/        # React context providers composed into RootProvider
├── router/
│   └── index.tsx     # createBrowserRouter route tree with lazy loading
├── styles/
│   └── globals.css   # Tailwind base + CSS custom properties (theme tokens)
└── types/
    ├── auth.ts       # Auth-related type aliases
    ├── common.ts     # Shared generic types (PaginatedResponse, ApiError, etc.)
    └── database.ts   # Auto-generated Supabase database types
```

---

## Feature Modules

All business logic is organized by feature under `src/features/`. Each feature owns its pages, components, hooks, services, schemas, and types. Nothing crosses feature boundaries except through the shared `components/`, `hooks/`, and `lib/` directories.

| Feature | Pages | Description |
|---|---|---|
| `auth` | Login, Register, ForgotPassword, ResetPassword | Supabase email/password authentication |
| `dashboard` | DashboardPage | Overview stats and recent activity |
| `meetings` | MeetingsPage, MeetingDetailPage, NewMeetingPage | Core meeting CRUD and AI processing pipeline |
| `action-items` | ActionItemsPage | Cross-meeting action item tracking |
| `calendar` | CalendarPage | Calendar view of scheduled meetings |
| `analytics` | AnalyticsPage | Usage statistics and charts (Recharts) |
| `search` | SearchPage | Full-text search across meetings |
| `participants` | ParticipantsPage, ParticipantProfilePage | Contact directory |
| `workspaces` | WorkspacesPage | Workspace management and member roles |
| `folders` | (components only) | Meeting organization into folders |
| `notifications` | (service + hook only) | In-app notification feed |
| `settings` | SettingsPage | Profile and account settings |
| `ai` | (services + types only) | Transcription and analysis abstractions |

### Feature internal structure (example: `meetings`)

```
features/meetings/
├── components/     # MeetingCard, NewMeetingForm, FileDropzone, EditMeetingDialog, …
├── hooks/          # useMeetings, useMeetingDetail, useUploadMeeting, useExportPDF
├── pages/          # MeetingsPage, MeetingDetailPage, NewMeetingPage
├── services/
│   ├── meetings.service.ts           # Supabase CRUD
│   ├── meeting-processing.service.ts # AI pipeline orchestrator
│   └── participant-matcher.ts        # Utility: match free-text names to contacts
└── types.ts        # ParticipantEntry discriminated union
```

---

## Provider Tree

`main.tsx` renders a single `<RootProvider />` that composes all global providers in this order:

```
ThemeProvider         ← persists light/dark preference
  QueryProvider       ← TanStack Query client
    AuthProvider      ← Supabase session + auth state
      WorkspaceProvider ← active workspace + role
        RouterProvider  ← React Router
        Toaster         ← Toast notification outlet
```

Each layer only wraps what depends on it. `RouterProvider` is inside `AuthProvider` so route components can safely call `useAuth()`.

---

## Routing

Routes are defined in `src/router/index.tsx` using React Router v6's `createBrowserRouter`. All page components are **lazy-loaded** via `React.lazy` and wrapped in `<Suspense>` with a `<PageLoader>` fallback, enabling per-route code splitting automatically.

Two layout shells exist:

- **`AuthLayout`** — unauthenticated pages (login, register, forgot/reset password)
- **`AppLayout` + `ProtectedRoute`** — authenticated pages; redirects unauthenticated users to `/login`

```
/                         → DashboardPage
/dashboard                → DashboardPage
/meetings                 → MeetingsPage
/meetings/:id             → MeetingDetailPage
/meetings/new             → NewMeetingPage
/search                   → SearchPage
/action-items             → ActionItemsPage
/calendar                 → CalendarPage
/analytics                → AnalyticsPage
/settings                 → SettingsPage
/settings/:tab            → SettingsPage (tabbed)
/workspaces               → WorkspacesPage
/participants             → ParticipantsPage
/participants/:id         → ParticipantProfilePage
/login                    → LoginPage
/register                 → RegisterPage
/forgot-password          → ForgotPasswordPage
/reset-password           → ResetPasswordPage
*                         → NotFoundPage
```

Route path strings are kept in `src/config/routes.ts` — never hardcoded at the call site.

---

## State Management

### Server state — TanStack Query

All remote data is fetched and cached with TanStack Query. The pattern is consistent across every feature:

1. A **service** (`*.service.ts`) performs the raw Supabase query and returns typed data.
2. A **hook** (`use*.ts`) wraps the service call in `useQuery` or `useMutation`, owns the query key, and handles invalidation.
3. A **page or component** calls the hook — it never touches the service or Supabase directly.

```ts
// Service layer
export const meetingsService = {
  getMeetings: () => supabase.from('meetings').select('*')...
}

// Hook layer
export function useMeetings() {
  return useQuery({ queryKey: ['meetings'], queryFn: meetingsService.getMeetings })
}

// Component layer
const { data, isLoading } = useMeetings()
```

### Client state — React Context

Two global contexts carry state that many unrelated components need:

- **`AuthContext`** — current Supabase `User`, `Session`, loading state, `signOut`, and `isRecoveryMode` flag. Subscribes to `onAuthStateChange` and clears the query cache on sign-out.
- **`WorkspaceContext`** — list of workspaces, the active workspace (persisted to `localStorage`), the user's role in it, and derived booleans (`isOwner`, `isAdminOrOwner`). Auto-creates a "Personal" workspace on first login.

Local UI state (dialogs open/closed, form step, etc.) stays in component `useState`. No Redux or Zustand.

---

## AI Pipeline

The AI processing pipeline runs entirely client-side against the Groq API. It is triggered after a meeting file is uploaded and orchestrated by `meetingProcessingService`.

```
User uploads file
       │
       ▼
meetingProcessingService.process()
       │
       ├─ 1. transcriptionService.transcribe(file)
       │       ├── Text/TXT files → read directly (no API call)
       │       └── Audio/Video → POST to Groq Whisper (whisper-large-v3)
       │                         returns plain text transcript
       │
       ├─ 2. analysisService.analyze(transcript)
       │       └── POST to Groq Chat Completions (llama-3.3-70b-versatile)
       │           with structured JSON schema prompt
       │           returns MeetingAnalysis object
       │
       └─ 3. Persist to Supabase
               ├── meetings (status, summary, key_points, ai_analysis JSONB)
               ├── action_items
               ├── key_decisions
               ├── risks
               └── follow_up_questions
```

The meeting row's `status` column is updated at each phase (`transcribing` → `analyzing` → `completed`), enabling the UI to reflect real-time progress via the `onPhase` callback and database polling.

The `MeetingAnalysis` type (in `features/ai/types/index.ts`) is the single source of truth for what the AI returns. The analysis prompt enforces this schema with `response_format: { type: 'json_object' }` and `temperature: 0` for deterministic output.

---

## Backend — Supabase

### Authentication

Supabase email/password auth with session persistence and auto token refresh. The client is configured in `lib/supabase.ts` with `detectSessionInUrl: true` to handle magic links and password reset flows. The `isRecoveryMode` flag in `AuthContext` prevents `AuthLayout` from redirecting users away from `/reset-password` before they can submit the form.

### Database

The database schema is reflected in `src/types/database.ts` (generated by Supabase CLI). Key tables:

| Table | Purpose |
|---|---|
| `workspaces` | Workspace records |
| `workspace_members` | User ↔ workspace membership with `role` (owner/admin/member) |
| `meetings` | Meeting records including `ai_analysis` JSONB column |
| `action_items` | Extracted action items linked to meetings |
| `key_decisions` | Extracted decisions linked to meetings |
| `risks` | Extracted risks linked to meetings |
| `follow_up_questions` | Extracted open questions linked to meetings |
| `folders` | Organizational folders per workspace |
| `participants` | Workspace contact directory |
| `meeting_contacts` | Junction: meetings ↔ participants |

Row Level Security (RLS) is enforced on all tables so users can only access their own workspace data.

### Storage

Meeting audio and video files are stored in Supabase Storage. The upload hook handles file upload before triggering the AI processing pipeline.

---

## UI System

### Component Layers

```
shadcn/ui primitives  (src/components/ui/)
        │
        ▼
shared common components  (src/components/common/)
        │
        ▼
feature components  (src/features/*/components/)
        │
        ▼
pages  (src/features/*/pages/)
```

### Styling

Tailwind CSS with a custom design token layer defined as CSS custom properties in `globals.css`. Colors, radii, shadows, and spacing follow a consistent professional-blue SaaS language. The `cn()` utility (`clsx` + `tailwind-merge`) handles conditional class composition throughout.

Dark mode is toggled by `ThemeProvider` (class-based strategy) and persisted to `localStorage`. The `ThemeToggle` component in the header provides the user control.

### Animations

Framer Motion is used for page transitions and interactive element animations. Subtle entrance animations improve perceived performance without being distracting.

---

## Data Flow Summary

```
User action
    │
    ▼
Component (calls hook)
    │
    ▼
Hook (useQuery / useMutation)
    │
    ├─── reads: returns cached data immediately, refetches in background
    └─── writes: calls service, on success invalidates relevant query keys
              │
              ▼
           Service (Supabase query or Groq fetch)
              │
              ▼
           Supabase / Groq API
```

---

## Configuration & Environment

All runtime configuration is injected via Vite environment variables:

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_GROQ_API_KEY` | Groq API key (used browser-side) |
| `VITE_APP_NAME` | Application display name |
| `VITE_APP_URL` | Canonical app URL |
| `VITE_ENABLE_ANALYTICS` | Feature flag for analytics page |
| `VITE_ENABLE_DEVTOOLS` | Feature flag for React Query devtools |

`APP_CONFIG` in `src/config/app.ts` centralizes all derived constants (upload limits, accepted MIME types, pagination defaults) so they are never scattered across the codebase.

---

## Build & Tooling

| Tool | Role |
|---|---|
| Vite | Dev server and production bundler |
| TypeScript | Strict typing throughout (`no any`) |
| ESLint | Linting with React Hooks and React Refresh plugins |
| Prettier | Code formatting with Tailwind class sorting |
| `tsc --noEmit` | Type checking as a separate CI step |

Scripts:

```sh
npm run dev          # Start dev server
npm run build        # Type-check + Vite production build
npm run type-check   # Type-check only
npm run lint         # Lint (zero warnings policy)
npm run format       # Format all src files
```

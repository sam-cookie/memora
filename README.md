<p align="center">
  <img src="src/assets/memora.png" alt="Memora" width="80" />
</p>

<h1 align="center">Memora</h1>

<p align="center">
  AI-powered meeting assistant that transforms recordings and transcripts into organized, searchable knowledge.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI-AI-412991?style=flat&logo=openai&logoColor=white" alt="OpenAI" />
</p>

---

## Overview

Memora turns the chaos of meetings into structured, retrievable information. Upload a recording or paste a transcript and Memora automatically transcribes, summarizes, and extracts everything that matters — action items, decisions, risks, and follow-up questions — all stored in a searchable knowledge base your team can rely on.

## Features

### Meetings

- Upload audio recordings or paste raw transcripts
- Automatic transcription via OpenAI Whisper
- AI-generated summaries, decisions, action items, risks, and follow-up questions
- PDF export of full meeting notes
- Folder organization with drag-and-drop management
- Edit and delete meetings

### Action Items

- Unified view of action items across all meetings
- Filter by status, priority, and assignee
- Track completion and due dates

### Calendar

- Calendar view of all meetings by date
- Click-through to meeting detail from any day

### Analytics

- Meeting frequency, duration, and participation trends
- Action item completion rates
- Visual charts powered by Recharts

### Search

- Full-text search across meetings, transcripts, summaries, and action items
- Command palette (`⌘K` / `Ctrl+K`) for quick navigation

### Workspaces

- Multi-tenant workspace support
- Invite and manage members with role-based access (Owner, Admin, Member)
- Switch between workspaces seamlessly

### Participants

- Participant directory with profile pages
- Meeting history and action item tracking per participant

### Settings

- Profile management
- Theme toggle (light / dark)
- Notification preferences

---

## Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Framework     | React 19 + TypeScript                     |
| Build         | Vite                                      |
| Styling       | Tailwind CSS + shadcn/ui                  |
| Routing       | React Router v6                           |
| Data Fetching | TanStack Query v5                         |
| Forms         | React Hook Form + Zod                     |
| Animation     | Framer Motion                             |
| Icons         | Lucide React                              |
| Charts        | Recharts                                  |
| PDF           | @react-pdf/renderer                       |
| Backend       | Supabase (Auth, PostgreSQL, Storage, RLS) |
| AI            | OpenAI Responses API + Whisper            |
| Deployment    | Vercel                                    |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/sam-cookie/memora.git
cd memora

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Development

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Other Scripts

| Command              | Description                  |
| -------------------- | ---------------------------- |
| `npm run dev`        | Start the dev server         |
| `npm run build`      | Production build             |
| `npm run preview`    | Preview the production build |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint`       | Lint with ESLint             |
| `npm run lint:fix`   | Auto-fix lint errors         |
| `npm run format`     | Format with Prettier         |

---

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared utility components (SearchCommand, PageHeader, ErrorBoundary…)
│   ├── layouts/         # App shell (AppLayout, Sidebar, Header, AuthLayout)
│   └── ui/              # shadcn/ui base components
├── features/
│   ├── auth/            # Login, register, forgot/reset password
│   ├── meetings/        # Meeting list, detail, upload, edit, export
│   ├── action-items/    # Action items dashboard
│   ├── calendar/        # Calendar view
│   ├── analytics/       # Analytics and charts
│   ├── search/          # Full-text search
│   ├── workspaces/      # Workspace management and member roles
│   ├── participants/    # Participant directory and profiles
│   ├── folders/         # Folder CRUD and meeting organization
│   ├── dashboard/       # Home dashboard
│   └── settings/        # User and workspace settings
├── hooks/               # Shared React hooks
├── providers/           # React context providers (Auth, Query, Theme, Workspace)
├── router/              # Route definitionsch
├── lib/                 # Utility functions and Supabase client
├── types/               # Shared TypeScript types
└── assets/              # Static assets
```

---

## Architecture Decisions

- **Feature-based structure** — all code for a feature lives together, making it easy to find and reason about.
- **Lazy loading** — every page is code-split and loaded on demand, keeping the initial bundle small.
- **Row Level Security** — all data access is enforced at the database level via Supabase RLS policies, so the backend is safe regardless of client-side logic.
- **TanStack Query** — all server state is managed with caching, background refetching, and optimistic updates where appropriate.
- **Zod schemas** — validation is colocated with form definitions, ensuring types and runtime checks stay in sync.

---

## License

PRIVATE

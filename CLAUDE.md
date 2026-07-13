# CLAUDE.md

# Memora

Memora is a modern AI-powered meeting assistant that transforms meeting recordings and transcripts into organized, searchable knowledge.

The application allows users to:

- Upload meeting recordings or transcripts
- Automatically transcribe audio
- Generate AI summaries
- Extract action items
- Identify decisions made
- Identify risks and blockers
- Generate follow-up questions
- Search previous meetings
- Export meeting notes

The goal is to build a production-ready SaaS application that demonstrates modern frontend architecture, AI integration, and exceptional UX.

---

# Tech Stack

## Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- React Hook Form
- Zod
- Framer Motion
- Lucide React

## Backend

- Supabase
  - Authentication
  - PostgreSQL
  - Storage
  - Row Level Security

## AI

- Groq AI API
- Groq Whisper API (or another transcription service)

## Deployment

- Vercel

---

# Development Philosophy

This project is intended to be portfolio quality.

Prioritize:

- Clean architecture
- Reusable components
- Excellent user experience
- Accessibility
- Responsive design
- Maintainability
- Performance
- Scalability

Do not take shortcuts that reduce code quality.

---

# Coding Standards

Always:

- Use TypeScript.
- Never use `any`.
- Prefer interfaces for object shapes.
- Keep components focused and reusable.
- Separate UI from business logic.
- Extract reusable hooks when appropriate.
- Prefer composition over deeply nested components.
- Keep files organized.
- Avoid duplicated logic.
- Write readable code before clever code.

---

# Project Structure

Organize code using feature-based architecture.

Example:

src/
components/
features/
hooks/
layouts/
pages/
services/
lib/
context/
types/
assets/

Keep shared UI inside components.

Keep business logic inside features or services.

---

# UI Guidelines

Design language:

- Modern SaaS
- Clean layout
- Spacious spacing
- Soft shadows
- Rounded corners
- Smooth animations
- Professional blue color palette
- Consistent typography

Every page should include:

- Loading states
- Empty states
- Error states
- Success feedback
- Responsive layouts

---

# AI Standards

When generating structured meeting data:

Return structured JSON whenever possible.

Prefer deterministic outputs.

Avoid unnecessary formatting.

---

# Performance

Optimize for:

- Fast initial load
- Lazy loading
- Code splitting
- Memoization when appropriate
- Efficient React rendering

Avoid unnecessary re-renders.

---

# Accessibility

Ensure:

- Semantic HTML
- Keyboard navigation
- ARIA labels where appropriate
- Proper focus management
- Sufficient color contrast

Accessibility is required, not optional.

---

# Error Handling

Every async operation should include:

- Loading state
- Error handling
- User-friendly messages
- Retry options where appropriate

Never leave users without feedback.

---

# Documentation

Use JSDoc for exported utilities and complex functions.

Comment _why_ something exists, not _what_ obvious code does.

---

# Definition of Done

A task is complete only if:

✓ Fully typed

✓ Responsive

✓ Accessible

✓ Error handled

✓ Loading handled

✓ No console warnings

✓ No TypeScript errors

✓ No ESLint errors

✓ Matches project design system

✓ Code is reusable

---

# Instructions for Claude

Before implementing new features:

1. Analyze the request.
2. Check if reusable components already exist.
3. Reuse existing patterns whenever possible.
4. Keep architecture consistent.
5. Explain important implementation decisions.
6. If a request conflicts with the existing architecture, propose the better solution first.

Always favor long-term maintainability over short-term speed.

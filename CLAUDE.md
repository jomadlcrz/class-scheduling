# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Read `AGENTS.md` first.** It's the detailed, actively-maintained contributor guide for this repo (project slices, API contracts, full reuse-component table, design tokens, definition-of-done). This file gives a condensed architecture map and the commands you need day-to-day — it does not duplicate `AGENTS.md`, so keep both in sync if conventions change.

## Project overview

GWC Class Scheduling frontend — builds conflict-free academic timetables. This repo is **frontend only**: React Router 7 (framework mode, SSR), React 19, TypeScript strict, Tailwind CSS v4. It talks to a **separate Flask backend** in the sibling repo `C:\Users\jomadlcrz\Desktop\class-scheduling-backend` (base URL from `VITE_API_URL` in `.env`, already includes `/api/v1`). There is no database, ORM, or migrations in this repo — the backend owns all of that. The backend is the single source of truth for data, validation, and vocabulary; the frontend never invents business logic or copy on its own (see "Backend-truth convention" below).

## Commands

```
npm run dev          # dev server (Vite, port 5173)
npm run build         # production build — must pass before finishing work
npm run typecheck     # react-router typegen && tsc — must pass before finishing work
npm run start         # serve the production build
npm run test:perf     # Playwright perf suite — runs against the PRODUCTION build (npm run start), not unit tests
```

There is no unit/component test suite and no ESLint/Prettier configured — `tsc` (strict mode) is the only automated check. Auth flows need the backend running at `VITE_API_URL`, and this frontend's origin must be listed in the backend's `CORS_ORIGIN`.

## Architecture

**Data-flow boundary:** components never fetch directly. The chain is always `component → app/services/*.service.ts → app/lib/api.ts (Bearer token, error normalization) → Flask backend`. `app/lib/api.ts` normalizes the backend's inconsistent error shapes (`{error}` / `{errors}` / `{message}`) into a single `ApiError`.

**Backend-truth convention:** error messages, success messages, and enum/vocabulary values (gender, roles, subject type, room type, etc.) are all surfaced **verbatim** from backend responses — never hardcoded or reworded on the frontend. Errors render inline via `FormError`; success messages go through `toast.success(message)` (sonner) only when the backend actually returns one — no message means no toast, not invented copy. Enum options come from `enumService.getOptions()`, never re-declared as frontend constants.

**Auth flow:** one login form, but the backend has five per-role endpoints. The service tries `/students/login` first and silently retries the endpoint named in a 403 wrong-portal response. Login returns a JWT only — `User` is decoded from token claims in `app/lib/session.ts`, not returned by the backend directly. A temp-password login returns no token, only a pending first-login-change state that gates `/change-password`. Roles (`admin | registrar | dean | faculty | student`) are mapped from the backend's enum names at this auth boundary. Route protection: `AuthGuard` / `GuestGuard` / `RoleGuard` in `app/auth/`.

**Routing:** `app/routes.ts` is the single route table (React Router 7 framework-mode `route`/`layout`/`index` helpers) — every page must be wired here or it doesn't exist. Public pages live under `app/routes/public/`; the authenticated area is wrapped in `layout("layouts/app-shell.tsx", …)`, with a nested `layouts/settings-layout.tsx` for `/settings/*`.

**Stub-file trap:** much of `app/routes/app/`, `app/layouts/`, and parts of `app/hooks`/`app/types` are intentionally empty placeholders for unbuilt features. Fill them in when implementing that feature; otherwise leave them alone. Never wire an empty stub into `routes.ts` — it isn't a valid module and breaks `npm run typecheck`.

**Folder layout:**
- `app/components/{ui,forms,feedback,theme}/` — generic, reusable UI (buttons, inputs, tables, modals, toasts)
- `app/features/<domain>/` — domain-specific UI (scheduling, faculty, rooms, conflicts, etc.)
- `app/auth/` — auth forms, guards, auth page chrome
- `app/lib/` — pure utilities: `api.ts`, `session.ts`, `storage.ts`, `validators.ts`, `permissions.ts`, `time.ts`
- `app/services/` — the data-access layer, one `*.service.ts` per domain
- `app/schemas/` — zod schemas, required-field checks only; business-rule validation (room conflicts, faculty double-booking, hour caps, etc.) is backend-enforced and surfaced via `ApiError`
- `app/types/` — domain TypeScript types

**Design system:** tokens live in `app/app.css` under Tailwind v4's `@theme` block (no `tailwind.config.js`) — always use the Tailwind names, never hardcode hex values. Two fonts only: `font-display` (Bebas Neue, headings) and `font-sans` (Century Gothic, everything else). Dark mode is class-based (`.dark` on `<html>`) — every visual class needs a `dark:` counterpart.

## Known issue

`app/services/administrator.service.ts` is a UI-only in-memory mock (no backend endpoints exist yet for admin/registrar account management) — swap its internals for real `apiGet`/`apiPost`/`apiPatch`/`apiDelete` calls (see `faculty.service.ts`) once the backend exposes them.

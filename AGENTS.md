# AGENTS.md — GWC Class Scheduling

Guidance for AI agents and contributors working in this repo. Follow these conventions so new code looks like existing code.

## Project overview

A class-scheduling web app for GWC (builds conflict-free academic timetables). **Connected to the real backend** (Flask, separate repo at `C:\Users\jomadlcrz\Desktop\class-scheduling-backend` — check there for actual endpoints, schemas, enum values, and response messages; base URL from `VITE_API_URL` in `.env`, already including `/api/v1`). Data access goes through `app/services/*.service.ts`; components must never know where data comes from: always call the service, never inline data in components.

The auth slice is live against the backend end-to-end:

- **Login** — single form, but the backend has five per-role endpoints (`/super-admin/login`, `/registrar-admin/login`, `/deans/login`, `/faculty/login`, `/students/login`). The service tries `/students/login` first and silently retries the endpoint named in a 403 wrong-portal response (`{ error, role: ["FACULTY", …] }`). Success returns **only a JWT** — the `User` is decoded from token claims in `lib/session.ts`.
- **Session** — `{ token, user }` persisted under `gwc-session` ("remember me" → localStorage, otherwise sessionStorage); expired tokens are dropped on read. The Bearer token is attached to requests by `lib/api.ts`.
- **Forced first-login password change** — a temp-password login returns no token, only `{ user_id, temp_password: true }`; the service stores a pending state and the login form routes to `/change-password`, which is **only reachable while that pending state exists** (otherwise it redirects to `/login`). Logged-in users change passwords in Settings → Security instead.
- **Logout** — fire-and-forget `POST /user/logout` (server-side token revocation), then clears storage.
- **Error messages come verbatim from backend responses** (`{ error }` or `{ message }`) via `ApiError` — never write frontend copy for API failures; a generic fallback exists only for network failures/bodyless responses.
- `requestPasswordReset` targets `POST /auth/forgot-password`, which the backend does **not implement yet** — confirm the path when it lands.

**Super-admin slice (also live):**

- **Roles page** (`/roles`) — `roleService.list()` calls `GET /super-admin/permission-slugs` (requires a Super Admin token + `system:manage_roles`): real role names and permission slugs; the permission matrix is derived from the union of the roles' permissions. An empty roles table comes back as 404 + `[]` — the service maps that to an empty list.
- **Faculty account creation** (`/faculty` → New Faculty) — `facultyService.create()` calls `POST /super-admin/create-faculty-accounts` (`{ departmentId, firstName, midName?, lastName, gender, civilStatus, contact: { mobile, email }, roleName: "Faculty" }`); the backend creates the login account + faculty profile and emails a temp password. The form (`faculty-account-form.tsx`) mirrors that contract; the department dropdown loads real integer-id departments via `facultyService.listDepartmentOptions()` (`GET /departments`, 404 = empty).

**Classroom mapping slice (live):**

- `classroomMappingService.list()` calls `GET /room_mapping/get-room-mapped` with query params `school_year`, `semester`, `building` (all optional). The backend returns rooms with their schedule days and 30-minute available slots. The frontend maps the response into `Classroom[]` with `ClassEntry[]` per room. Building filter is passed server-side, not filtered client-side.

**Schedule slice (live):**

- `scheduleService.createRegular()` calls `POST /regular_schedule/create-regular-class-schedules` and returns `{ message?, warnings? }` from the backend. Success messages are shown via `toast.success(message)`, warnings via `toast.warning()` (sonner). Error messages come verbatim from `ApiError` — never write frontend copy.
- `scheduleService.autoGenerate()` calls `POST /regular_schedule/auto-generate-schedule` and returns `{ slots, conflicts }`. Conflicts are backend-generated explanations for subjects that couldn't be placed.
- Frontend form validation (zod) only checks required fields are filled; all business logic validation (room occupied, faculty conflict, hour caps, missing load, gap violations) is handled by the backend and surfaced via `ApiError.message`.

**Backend is the single source of truth — never hardcode its vocabulary in the frontend:**

- **Enums** (gender, civil status, roles, student type, academic status, subject type, room type, classroom status, …) are fetched from `GET /student-registration/register-students` via `enumService.getOptions()` (`services/enum.service.ts`, cached per session) and passed through unmodified. **Always** load select/filter vocabulary from this endpoint — do NOT re-declare enum value lists as frontend constants or add invented options (e.g. a "Not specified" entry); selects render exactly what the endpoint returns; an unselected optional field is omitted from the payload and the backend applies its own default.
- **Error messages** shown in the UI come verbatim from backend responses via `ApiError` (see auth slice above) — no frontend-authored copy for API failures.
- **Success messages** follow the same rule: mutation service functions return the backend response's `message` verbatim via `apiMessage(data)` (`lib/api.ts`) — typed as `apiPost<{ message?: string }>(…)` — and route handlers surface it with `if (message) toast.success(message);` (sonner). Never write frontend success copy; if the response carries no `message`, show no toast (and fix it backend-side). Errors stay inline via `FormError` — do not toast them.
- If the backend response is missing something (a filtered value, an absent endpoint), fix or request it backend-side rather than patching values into the frontend.

**Roles:** `admin | registrar | dean | faculty | student` (`app/types/user.ts`). The backend's enum names (`SUPER_ADMIN`, `REGISTRAR_ADMIN`, `DEAN`, `FACULTY`, `STUDENT`) are mapped to these at the auth boundary in `lib/session.ts`. Sidebar items declare `roles` for visibility; pages enforce access with `RoleGuard`. Users + Roles admin pages are live (`/users`, `/roles`).

**Stack:** React Router 7 (framework mode, SSR), React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first config in `app/app.css`), `motion` for animation. No state-management or data-fetching library.

## Commands

```
npm run dev          # dev server (Vite, port 5173)
npm run build        # production build — must pass before finishing work
npm run typecheck    # react-router typegen && tsc — must pass before finishing work
npm run start        # serve the production build
npm run test:perf    # Playwright perf tests
```

Auth flows need the backend running at `VITE_API_URL` (`.env`), and the frontend origin must be listed in the backend's `CORS_ORIGIN`.

## Project structure

```
app/
├── routes.ts              # Route config (@react-router/dev/routes) — every page must be wired here
├── root.tsx               # HTML shell, font preloads, inline theme-init script, error boundary
├── app.css                # Tailwind v4 @theme tokens (colors, fonts) + custom utilities
├── routes/
│   ├── public/            # Unauthenticated pages (login, forgot/reset/change-password, legal, home)
│   └── app/               # Authenticated app pages (dashboard is live; rest are EMPTY STUBS)
├── auth/                  # Auth forms, guards, AuthLayout (page chrome for auth flows)
├── components/
│   ├── ui/                # Generic primitives: button, input, checkbox, spinner, icons, …
│   ├── forms/             # Form-level pieces (form-error, …)
│   ├── feedback/          # States: result-state, loading, no-data, …
│   └── theme/             # ThemeProvider + ThemeToggle (class-based dark mode)
├── features/<domain>/     # Feature-specific components (scheduling, faculty, rooms, ai, …)
├── landing/               # Marketing/landing page components (header, hero, footer, legal-layout)
├── layouts/               # App-shell layouts (EMPTY STUBS)
├── hooks/                 # Shared hooks (use-theme, use-auth are live; rest are stubs)
├── lib/                   # Pure utilities (validators, storage, api, session are live)
├── services/              # Data layer — all services talk to the REAL backend
└── types/                 # Domain types (user, auth, role, subject are live; rest are stubs)
```

**Where code goes:** generic, reusable UI → `components/ui`; domain-specific UI → `features/<domain>/`; pure logic → `lib/`; route files stay thin (meta + layout + composition — no markup-heavy forms or duplicated chrome inside routes).

**Stub files:** many files are intentionally empty placeholders for future work. Fill them when implementing their feature; otherwise leave them alone. ⚠️ Never wire an empty file into `routes.ts` — an empty file is not a module and breaks `npm run typecheck`.

## Code conventions

- **Files:** kebab-case (`forgot-password-form.tsx`, `use-theme.ts`).
- **Exports:** `export function PascalCaseComponent()` — named exports everywhere. Default exports **only** in route modules (required by React Router), alongside an exported `meta()`.
- **Types:** local `type Xyz = { … }` above the component; `import type { … }` for type-only imports.
- **Styling:** Tailwind utility classes inline in JSX. No CSS modules, no styled-components, no `clsx`/`cva`. Shared class strings live as `const` in the owning component file (see `inputClassName` in `components/ui/input.tsx`).
- **Comments:** sparse. JSDoc one-liner above a component only when its purpose/constraint isn't obvious. Section comments like `{/* ── Right form panel ── */}` for large JSX blocks.
- **Icons:** inline SVG components in `components/ui/icons.tsx` (stroke `currentColor`, `aria-hidden="true"`). Add new icons there — never re-declare an icon locally.
- **Forms:** uncontrolled inputs read via `new FormData(e.currentTarget)`; `noValidate` on the form; validation via `app/lib/validators.ts`; error string in `useState` rendered through `FormError`.
- **Accessibility is non-negotiable:** label every input, `role="alert"` on errors, `aria-label` on icon-only buttons, `focus-visible:ring-2 focus-visible:ring-gold-400` on every interactive element.

## Reuse before writing (live shared code)

| Need | Use |
|---|---|
| Submit button w/ loading, button-styled link | `Button`, `ButtonLink` — `components/ui/button.tsx` |
| Text/email field, password field w/ show-hide | `Input`, `PasswordInput` — `components/ui/input.tsx` |
| Checkbox (box-only clickable, by design) | `Checkbox` — `components/ui/checkbox.tsx` |
| Spinner, SVG icons | `components/ui/spinner.tsx`, `components/ui/icons.tsx` |
| Form-level error alert | `FormError` — `components/forms/form-error.tsx` |
| Success/error terminal state (icon + title + CTA) | `ResultState` — `components/feedback/result-state.tsx` |
| Auth page chrome (bg, logo, back link, heading) | `AuthLayout`, `AuthHeading`, `AmbientBackground`, `BrandLogo` — `app/auth/auth-layout.tsx` |
| Shared reset/change password form | `PasswordForm` — `app/auth/password-form.tsx` |
| Email/password validation | `isValidEmail`, `validateNewPassword`, `MIN_PASSWORD_LENGTH` — `app/lib/validators.ts` |
| Theme context | `ThemeProvider` (`components/theme/theme-provider.tsx`), `useTheme` (`hooks/use-theme.ts`) |
| Auth state (user, login, logout) | `AuthProvider` (`app/auth/auth-provider.tsx`), `useAuth` (`hooks/use-auth.ts`) — provider is mounted in `root.tsx` |
| Route protection | `AuthGuard` / `GuestGuard` / `RoleGuard` — `app/auth/auth-guard.tsx`, `guest-guard.tsx`, `role-guard.tsx` |
| Badges (incl. role/status) | `Badge` (`components/ui/badge.tsx`), `RoleBadge` (`features/users/role-badge.tsx`) |
| Tables | `Table`/`TableHead`/`TableBody`/`TableRow`/`TableHeader`/`TableCell` — `components/ui/table.tsx` |
| Modals & confirmations | `Modal`, `ConfirmDialog` — `components/ui/modal.tsx` |
| Select dropdown | `Select` — `components/ui/select.tsx` (shares `FieldChrome`/`inputClassName` from input.tsx) |
| Empty list placeholder | `EmptyState` — `components/feedback/empty-state.tsx` |
| Auth API (real backend) | `authService` — `services/auth.service.ts` |
| Backend fetch wrapper (Bearer token, verbatim backend errors) | `apiGet`/`apiPost`/`apiPatch`/`apiPut`/`apiDelete`, `ApiError`, `apiMessage` — `lib/api.ts` |
| Success toasts (backend message verbatim) | `toast` from `sonner`; `Toaster` — `components/ui/sonner.tsx`, mounted in `layouts/app-shell.tsx` |
| Backend enum options (gender, civil status, roles, …) | `enumService.getOptions()` — `services/enum.service.ts` |
| JWT/session helpers (claims → `User`, pending first-login state) | `loadSession`/`saveSession`/`userFromToken`/… — `lib/session.ts` |
| Safe browser storage (SSR-proof) | `loadJson`/`saveJson`/`removeJson` — `lib/storage.ts` |
| Full-screen loading spinner | `LoadingState` — `components/feedback/loading-state.tsx` |

## Design system

Tokens are defined in `app/app.css` under `@theme` — use the Tailwind names, never hard-code hex values in JSX.

- **Fonts (two only):** `font-display` (Bebas Neue) for the wordmark and headings with `tracking-wide`; `font-sans` (Century Gothic) for everything else. Both served locally from `/public/fonts`.
- **Colors:** `navy-300…950` (primary + dark surfaces), `gold-300…600` (accent, focus rings), `cream-50/100` (light surfaces), Tailwind `slate` for neutral text/borders.
- **Dark mode:** class-based (`.dark` on `<html>`, toggled by `ThemeProvider`, persisted as `localStorage["gwc-theme"]`, pre-paint init script in `root.tsx`). **Every visual class needs a `dark:` counterpart** — light: `bg-cream-50`, borders `slate-300`; dark: `bg-navy-950`, borders `white/10–15`.
- **Recurring patterns:** primary button = `bg-navy-800 … dark:bg-white dark:text-navy-900`; ambient radial-gradient backdrops; `blueprint-grid` utility for the timetable texture; `rounded-lg` inputs/buttons, `rounded-full` icon buttons; `motion/react` with `AnimatePresence` for enter/exit animation, durations 150–250ms.

## Adding a page (checklist)

1. Create the route module in `app/routes/public/` (or `app/routes/app/` once that area is live) — default export + `meta()` returning a `"… — GWC Class Scheduling"` title.
2. Wire it in `app/routes.ts`.
3. Compose from shared components; put any new form/feature component in `app/auth/` or `app/features/<domain>/`, not in the route file.
4. Auth-flow pages wrap content in `AuthLayout`; standalone pages must wrap in `ThemeProvider` themselves.
5. Authenticated pages wrap content in `AuthGuard`; guest-only pages (login) in `GuestGuard`.

## Definition of done

1. `npm run typecheck` passes.
2. `npm run build` passes.
3. Touched routes render without errors (`npm run dev`, then request the route — SSR surfaces render errors as 500s).
4. Both themes checked (toggle or `.dark` class) and keyboard focus states visible.
5. No new duplication: icons/spinners/inputs/buttons come from `components/ui`; no copy-pasted page chrome.

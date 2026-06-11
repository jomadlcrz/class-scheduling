# AGENTS.md — GWC Class Scheduling

Guidance for AI agents and contributors working in this repo. Follow these conventions so new code looks like existing code.

## Project overview

A class-scheduling web app for GWC (builds conflict-free academic timetables). Frontend only — there is **no API layer yet**; form submits use simulated `setTimeout` calls marked with `// TODO: POST …` comments. Keep that pattern until the services layer is implemented.

**Stack:** React Router 7 (framework mode, SSR), React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first config in `app/app.css`), `motion` for animation. No state-management or data-fetching library.

## Commands

```
npm run dev          # dev server (Vite, port 5173)
npm run build        # production build — must pass before finishing work
npm run typecheck    # react-router typegen && tsc — must pass before finishing work
npm run start        # serve the production build
npm run test:perf    # Playwright perf tests
```

## Project structure

```
app/
├── routes.ts              # Route config (@react-router/dev/routes) — every page must be wired here
├── root.tsx               # HTML shell, font preloads, inline theme-init script, error boundary
├── app.css                # Tailwind v4 @theme tokens (colors, fonts) + custom utilities
├── routes/
│   ├── public/            # Unauthenticated pages (login, forgot/reset/change-password, legal, home)
│   └── app/               # Authenticated app pages (EMPTY STUBS — not yet wired into routes.ts)
├── auth/                  # Auth forms, guards, AuthLayout (page chrome for auth flows)
├── components/
│   ├── ui/                # Generic primitives: button, input, checkbox, spinner, icons, …
│   ├── forms/             # Form-level pieces (form-error, …)
│   ├── feedback/          # States: result-state, loading, no-data, …
│   └── theme/             # ThemeProvider + ThemeToggle (class-based dark mode)
├── features/<domain>/     # Feature-specific components (scheduling, faculty, rooms, ai, …)
├── landing/               # Marketing/landing page components (header, hero, footer, legal-layout)
├── layouts/               # App-shell layouts (EMPTY STUBS)
├── hooks/                 # Shared hooks (use-theme is live; rest are stubs)
├── lib/                   # Pure utilities (validators is live; api/storage/etc. are stubs)
├── services/              # API service modules (EMPTY STUBS — future data layer)
└── types/                 # Domain types (EMPTY STUBS)
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

## Definition of done

1. `npm run typecheck` passes.
2. `npm run build` passes.
3. Touched routes render without errors (`npm run dev`, then request the route — SSR surfaces render errors as 500s).
4. Both themes checked (toggle or `.dark` class) and keyboard focus states visible.
5. No new duplication: icons/spinners/inputs/buttons come from `components/ui`; no copy-pasted page chrome.

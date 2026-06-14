import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/public/home.tsx"),
  route("login", "routes/public/login.tsx"),
  route("forgot-password", "routes/public/forgot-password.tsx"),
  route("reset-password", "routes/public/reset-password.tsx"),
  route("change-password", "routes/public/change-password.tsx"),
  route("privacy-policy", "routes/public/privacy-policy.tsx"),
  route("terms-of-use", "routes/public/terms-of-use.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),

  // Authenticated area — AppShell provides theme, auth guard, and chrome.
  layout("layouts/app-shell.tsx", [
    route("dashboard", "routes/app/dashboard.tsx"),
    route("users", "routes/app/users.tsx"),
    route("roles", "routes/app/roles.tsx"),
    route("buildings", "routes/app/buildings.tsx"),
    route("rooms", "routes/app/rooms.tsx"),
    route("departments", "routes/app/departments.tsx"),
    route("programs", "routes/app/programs.tsx"),
    route("subjects", "routes/app/subjects.tsx"),
    route("subjects/new", "routes/app/subjects-new.tsx"),
    route("sets", "routes/app/sets.tsx"),
    route("faculty", "routes/app/faculty.tsx"),
    route("schedules", "routes/app/schedules.tsx"),
    route("schedules/new", "routes/app/schedules-new.tsx"),
    route("curriculum", "routes/app/curriculum.tsx"),
    route("facilities", "routes/app/facilities.tsx"),
    route("students", "routes/app/students.tsx"),
    route("conflicts", "routes/app/conflicts.tsx"),
    route("reports", "routes/app/reports.tsx"),

    layout("layouts/settings-layout.tsx", [
      route("settings/profile", "routes/app/settings/profile.tsx"),
      route("settings/appearance", "routes/app/settings/appearance.tsx"),
      route("settings/security", "routes/app/settings/security.tsx"),
      route("settings/recently-deleted", "routes/app/settings/recently-deleted.tsx"),
    ]),
  ]),
] satisfies RouteConfig;

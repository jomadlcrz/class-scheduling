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
  ]),
] satisfies RouteConfig;

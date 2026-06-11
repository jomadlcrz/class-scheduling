import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/public/home.tsx"),
  route("login", "routes/public/login.tsx"),
  route("forgot-password", "routes/public/forgot-password.tsx"),
  route("reset-password", "routes/public/reset-password.tsx"),
  route("change-password", "routes/public/change-password.tsx"),
  route("privacy-policy", "routes/public/privacy-policy.tsx"),
  route("terms-of-use", "routes/public/terms-of-use.tsx"),
  route("unauthorized", "routes/unauthorized.tsx"),
  route("dashboard", "routes/app/dashboard.tsx"),
] satisfies RouteConfig;

import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  route("reset-password", "routes/reset-password.tsx"),
  route("change-password", "routes/change-password.tsx"),
  route("privacy-policy", "routes/privacy-policy.tsx"),
  route("terms-of-use", "routes/terms-of-use.tsx"),
] satisfies RouteConfig;

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
  useNavigationType,
} from "react-router";

import { useEffect } from "react";
import type { Route } from "./+types/root";
import "~/app.css";
import { AuthProvider } from "~/auth/auth-provider";

// Runs before paint to set the `.dark` class from the stored/system preference,
// preventing a light flash on first load. Kept as a string so it ships inline.
const themeInitScript = `(() => {
  try {
    const stored = localStorage.getItem("gwc-theme");
    const isDark = stored
      ? stored === "dark"
      : !window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (_) {
    document.documentElement.classList.add("dark");
  }
})();`;

function ScrollToTopOnNav() {
  const navigation = useNavigation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigation.state === "idle" && navigationType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [navigation.state, navigationType]);

  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preload" href="/fonts/BebasNeue.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/CenturyGothic.woff" as="font" type="font/woff" crossOrigin="anonymous" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ScrollToTopOnNav />
        <ScrollRestoration getKey={(location) => location.pathname} />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status = 500;
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    details =
      error.status === 404
        ? "The page you're looking for doesn't exist."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  const is404 = status === 404;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream-50 px-6 text-center dark:bg-navy-950">
      <p className="select-none font-display text-[8rem] leading-none tracking-tight text-navy-900/10 dark:text-white/10">
        {status}
      </p>
      <h1 className="-mt-6 font-display text-3xl tracking-wide text-navy-700 dark:text-white">
        {is404 ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="mt-3 font-body text-base text-slate-500 dark:text-slate-400">{details}</p>
      <a
        href="/"
        className="mt-8 inline-flex w-72 items-center justify-center rounded-full bg-navy-800 py-3 font-body text-sm font-semibold text-white shadow-lg shadow-navy-800/20 transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-navy-950"
      >
        Go to Homepage
      </a>
      {stack && (
        <pre className="mt-8 w-full max-w-2xl overflow-x-auto rounded-lg bg-slate-100 p-4 text-left font-mono text-xs text-slate-600 dark:bg-white/5 dark:text-slate-300">
          {stack}
        </pre>
      )}
    </main>
  );
}

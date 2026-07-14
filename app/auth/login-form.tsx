import { useState } from "react";
import { useNavigate } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Checkbox } from "~/components/ui/checkbox";
import { Input, PasswordInput } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { loginSchema } from "~/schemas/auth.schema";
import { useAuth } from "~/auth/auth-provider";
import { markJustLoggedIn } from "~/layouts/dashboard-intro";

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const remember = data.get("remember") === "on";

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const outcome = await login({ ...result.data, remember });
      if ("requiresPasswordChange" in outcome) {
        navigate("/change-password", { replace: true });
      } else {
        markJustLoggedIn();
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <FormError message={error} />

  <Input
    id="identifier"
    label="Email Address"
    type="text"
    autoComplete="username"
    placeholder="you@gwc.edu.ph"
  />

      <PasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        labelEnd={
          <a
            href="/forgot-password"
            className="font-body text-xs text-navy-600 hover:underline focus-visible:outline-none focus-visible:underline dark:text-navy-300"
          >
            Forgot password?
          </a>
        }
      />

      <Checkbox id="remember" label="Remember me" />

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-800/20 transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-navy-950"
      >
        {isLoading ? (
          <>
            <Spinner />
            Logging in…
          </>
        ) : (
          "Log In"
        )}
      </button>
    </form>
  );
}

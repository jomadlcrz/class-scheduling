import { useState } from "react";
import { useNavigate } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Checkbox } from "~/components/ui/checkbox";
import { Input, PasswordInput } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { LockIcon, MailIcon } from "~/components/ui/icons";
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
    const email = String(data.get("email") ?? "").trim();
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
        err instanceof Error ? err.message : "",
      );
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <FormError message={error} />

      <Input
        id="email"
        label="Email Address"
        type="email"
        autoComplete="username"
        placeholder="you@gwc.edu.ph"
        icon={<MailIcon size={18} />}
      />

      <PasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        icon={<LockIcon size={18} />}
      />

      <Checkbox id="remember" label="Remember me" />

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-navy-800/20 transition-all duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-surface"
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

      {/* OR divider */}
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          OR
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>

      {/* Forgot Password link below OR divider */}
      <div className="text-center">
        <a
          href="/forgot-password"
          className="font-body text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Forgot your password?
        </a>
      </div>

      {/* Border / separator line */}
      <div className="my-1 border-t border-slate-200 dark:border-white/10" />

      {/* Legal agreement footer */}
      <p className="text-center font-body text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        By logging in, you agree to our{" "}
        <a
          href="/terms-of-use"
          className="font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:underline dark:text-blue-400"
        >
          Terms of Use
        </a>{" "}
        and{" "}
        <a
          href="/privacy-policy"
          className="font-semibold text-blue-600 hover:underline focus-visible:outline-none focus-visible:underline dark:text-blue-400"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

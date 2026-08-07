import { useState } from "react";
import { useNavigate } from "react-router";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input, PasswordInput } from "~/components/ui/input";
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

      <Button type="submit" pill isLoading={isLoading} loadingLabel="Logging in…">
        Log In
      </Button>

      {/* OR divider */}
      <div className="my-1 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-300 dark:bg-white/20" />
        <span className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          OR
        </span>
        <div className="h-px flex-1 bg-slate-300 dark:bg-white/20" />
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
      <div className="my-1 border-t border-slate-300 dark:border-white/20" />

      {/* Legal agreement footer */}
      <p className="text-center font-body text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        By logging in, you agree to our{" "}
        <a
          href="/terms-of-use"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Terms of Use
        </a>{" "}
        and{" "}
        <a
          href="/privacy-policy"
          className="font-semibold text-blue-600 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Privacy Policy
        </a>
        .
      </p>
    </form>
  );
}

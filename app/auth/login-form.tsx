import { useState } from "react";
import { useNavigate } from "react-router";
import { FormError } from "../components/forms/form-error";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input, PasswordInput } from "../components/ui/input";
import { loginSchema } from "../schemas/auth.schema";
import { useAuth } from "./auth-provider";

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
      const user = await login({ ...result.data, remember });
      navigate(user.mustChangePassword ? "/change-password?force=true" : "/dashboard", {
        replace: true,
      });
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
        label="Email"
        type="text"
        autoComplete="username"
        required
        placeholder="you@gwc.edu.ph"
      />

      <PasswordInput
        id="password"
        label="Password"
        autoComplete="current-password"
        labelEnd={
          <a
            href="/forgot-password"
            className="font-sans text-xs text-navy-600 transition-colors duration-150 hover:text-gold-600 focus-visible:outline-none focus-visible:text-gold-600 dark:text-navy-300 dark:hover:text-gold-300 dark:focus-visible:text-gold-300"
          >
            Forgot password?
          </a>
        }
      />

      <Checkbox id="remember" label="Remember me" />

      <Button isLoading={isLoading} loadingLabel="Logging in…">
        Log In
      </Button>
    </form>
  );
}

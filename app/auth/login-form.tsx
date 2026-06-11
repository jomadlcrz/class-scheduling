import { useState } from "react";
import { FormError } from "../components/forms/form-error";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input, PasswordInput } from "../components/ui/input";
import { isValidEmail } from "../lib/validators";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const email = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    // TODO: POST credentials to the login endpoint.
    setTimeout(() => setIsLoading(false), 1500);
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

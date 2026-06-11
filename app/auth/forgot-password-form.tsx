import { useState } from "react";
import { FormError } from "../components/forms/form-error";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { isValidEmail } from "../lib/validators";
import { authService } from "../services/auth.service";

export function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();

    if (!email || !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      onSent();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
      <FormError message={error} />

      <Input
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@gwc.edu.ph"
      />

      <Button isLoading={isLoading} loadingLabel="Sending…">
        Send Reset Link
      </Button>
    </form>
  );
}

import { useState } from "react";
import { FormError } from "~/components/forms/form-error";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { forgotPasswordSchema } from "~/schemas/auth.schema";
import { authService } from "~/services/auth.service";

export function ForgotPasswordForm({ onSent }: { onSent: (message: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const message = await authService.requestPasswordReset(result.data.email);
      onSent(message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "",
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
    label="Email Address"
    type="email"
    autoComplete="email"
    placeholder="you@gwc.edu.ph"
  />

      <Button type="submit" pill isLoading={isLoading} loadingLabel="Sending…">
        Send Reset Link
      </Button>
    </form>
  );
}

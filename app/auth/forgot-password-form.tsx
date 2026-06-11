import { useState } from "react";
import { FormError } from "../components/forms/form-error";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { isValidEmail } from "../lib/validators";

export function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();

    if (!email || !isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    // TODO: POST the email to the password-reset endpoint.
    setTimeout(() => {
      setIsLoading(false);
      onSent();
    }, 1500);
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

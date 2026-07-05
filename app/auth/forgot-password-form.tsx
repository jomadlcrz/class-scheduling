import { useState } from "react";
import { FormError } from "../components/forms/form-error";
import { Input } from "../components/ui/input";
import { Spinner } from "../components/ui/spinner";
import { forgotPasswordSchema } from "../schemas/auth.schema";
import { authService } from "../services/auth.service";

export function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
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
      await authService.requestPasswordReset(result.data.email);
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

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy-800/20 transition-colors duration-200 hover:bg-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-navy-900 dark:hover:bg-slate-100 dark:focus-visible:ring-offset-navy-950"
      >
        {isLoading ? (
          <>
            <Spinner />
            Sending…
          </>
        ) : (
          "Send Reset Link"
        )}
      </button>
    </form>
  );
}

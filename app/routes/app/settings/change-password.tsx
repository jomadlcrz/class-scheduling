import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AuthGuard } from "~/auth/auth-guard";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { EyeIcon, EyeOffIcon } from "~/components/ui/icons";
import { Modal } from "~/components/ui/modal";
import { ScreenHeader } from "~/components/ui/screen-header";
import { useAuth } from "~/hooks/use-auth";
import { authService } from "~/services/auth.service";

export function meta() {
  return [
    { title: "Change Password — GWC Class Scheduling" },
    { name: "description", content: "Change your student portal account password." },
  ];
}

interface FieldErrors {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

function AlertCircleIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckCircleIcon({ size = 16, className }: { size?: number; className?: string } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default function ChangePasswordRoute() {
  return (
    <AuthGuard>
      <ChangePasswordPage />
    </AuthGuard>
  );
}

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const newPasswordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [forgotConfirmOpen, setForgotConfirmOpen] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    if (fieldErrors[field] || formError) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      setFormError(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      toast.error("User email address was not found in the current session.");
      return;
    }

    setIsSendingReset(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      await authService.requestPasswordReset(user.email);
      const msg = `A password reset link has been sent to ${user.email}. Please check your email inbox.`;
      setSuccessMsg(msg);
      toast.success(msg);
      setForgotConfirmOpen(false);
    } catch (err: unknown) {
      const errText =
        err instanceof Error
          ? err.message
          : "Failed to send password reset link. Please try again later.";
      setFormError(errText);
      toast.error(errText);
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const errors: FieldErrors = {};

    if (!oldPassword.trim()) {
      errors.oldPassword = "Current password is required.";
    }

    if (!newPassword.trim()) {
      errors.newPassword = "New password is required.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters long.";
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirmation password is required.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "New password and confirmation do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.changePassword(newPassword, oldPassword);
      toast.success("Password updated successfully.");
      setSuccessMsg("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Smoothly navigate back after a brief pause so user sees confirmation
      setTimeout(() => {
        navigate(-1);
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update password.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-slate-50 dark:bg-surface">
      {/* Screen Header with Back Button */}
      <ScreenHeader
        title="Change Password"
        showBack
        onBack={() => navigate(-1)}
        className="border-b border-slate-200/90 bg-white dark:border-white/10 dark:bg-surface"
      />

      <div className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Enter your current password and choose a secure new password of at least 8 characters.
          </p>

          {/* Error Alert Banner */}
          {formError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Success Alert Banner */}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircleIcon size={16} className="mt-0.5 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password Field */}
            <div>
              <label
                htmlFor="oldPassword"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Current password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="oldPassword"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    clearFieldError("oldPassword");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      newPasswordRef.current?.focus();
                    }
                  }}
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-gold-400 dark:bg-white/5 dark:text-mist-100 dark:placeholder:text-slate-500 ${
                    fieldErrors.oldPassword
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-400/20 dark:border-rose-800"
                      : "border-slate-300 focus:border-gold-400 dark:border-white/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword((v) => !v)}
                  aria-label={showOldPassword ? "Hide current password" : "Show current password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-slate-200"
                >
                  {showOldPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.oldPassword && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.oldPassword}
                </p>
              )}
            </div>

            {/* Forgot Password Trigger Button */}
            <div className="flex">
              <button
                type="button"
                onClick={() => setForgotConfirmOpen(true)}
                disabled={isSendingReset}
                className="cursor-pointer text-xs font-semibold text-gwc-blue transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:opacity-50 dark:text-gwc-blue-bright"
              >
                {isSendingReset ? "Sending reset link..." : "Forgot your password?"}
              </button>
            </div>

            {/* New Password Field */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                New password
              </label>
              <div className="relative mt-1.5">
                <input
                  ref={newPasswordRef}
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    clearFieldError("newPassword");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmPasswordRef.current?.focus();
                    }
                  }}
                  autoComplete="new-password"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-gold-400 dark:bg-white/5 dark:text-mist-100 dark:placeholder:text-slate-500 ${
                    fieldErrors.newPassword
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-400/20 dark:border-rose-800"
                      : "border-slate-300 focus:border-gold-400 dark:border-white/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-slate-200"
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Confirm new password
              </label>
              <div className="relative mt-1.5">
                <input
                  ref={confirmPasswordRef}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearFieldError("confirmPassword");
                  }}
                  autoComplete="new-password"
                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:ring-2 focus:ring-gold-400 dark:bg-white/5 dark:text-mist-100 dark:placeholder:text-slate-500 ${
                    fieldErrors.confirmPassword
                      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-400/20 dark:border-rose-800"
                      : "border-slate-300 focus:border-gold-400 dark:border-white/15"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* Sticky Bottom Action Button for Mobile (< sm) & In-flow for Desktop (>= sm) */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/90 bg-white/95 p-4 backdrop-blur-md dark:border-white/10 dark:bg-surface/95 sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold shadow-xs sm:w-full"
              >
                {isSubmitting ? "Updating password..." : "Update password"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Confirmation Modal */}
      <Modal
        open={forgotConfirmOpen}
        onClose={() => setForgotConfirmOpen(false)}
        title="Forgot Your Password?"
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              block={false}
              className="px-4 py-2 text-xs font-bold"
              onClick={() => setForgotConfirmOpen(false)}
              disabled={isSendingReset}
            >
              Cancel
            </Button>
            <Button
              type="button"
              block={false}
              className="px-4 py-2 text-xs font-bold"
              onClick={handleForgotPassword}
              disabled={isSendingReset}
            >
              {isSendingReset ? "Sending link..." : "Send link"}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            We will send a password reset link to your registered email address:
          </p>
          <Card className="p-3 bg-slate-50 dark:bg-white/5">
            <span className="text-xs font-bold text-navy-700 dark:text-mist-100">
              {user?.email || "No email on record"}
            </span>
          </Card>
        </div>
      </Modal>
    </div>
  );
}

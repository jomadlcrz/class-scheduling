import { motion } from "motion/react";
import { AuthLayout } from "~/auth/auth-layout";
import { ButtonLink } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Unauthorized — GWC Class Scheduling" },
    {
      name: "description",
      content: "You don't have permission to access this page.",
    },
  ];
}

export default function Unauthorized() {
  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 className="font-display text-3xl tracking-wide text-navy-800 dark:text-mist-100">
            Unauthorized
          </h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Your account doesn't have permission to view this page. If you believe this
            is a mistake, contact your administrator.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
          className="mt-6 flex w-full flex-col items-center gap-2.5"
        >
          <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
          <a
            href="/"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 font-body text-sm font-medium text-slate-500 transition-colors duration-150 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:text-slate-400 dark:hover:text-mist-100"
          >
            Go to homepage
          </a>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
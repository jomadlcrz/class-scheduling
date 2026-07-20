import { ThemeProvider } from "~/components/theme/theme-provider";
import { SiteHeader } from "~/landing/site-header";
import { SiteFooter } from "~/landing/site-footer";

export function meta() {
  return [
    { title: "Help — GWC Class Scheduling" },
    { name: "description", content: "Help and frequently asked questions for GWC Class Scheduling." },
  ];
}

const FAQS = [
  {
    id: "forgot-password",
    question: "I forgot my password. What do I do?",
    answer:
      "Use the \"Forgot password\" link on the login page to request a reset. If you signed in with a temporary password emailed to you, you'll be asked to set a new one on first login instead.",
  },
  {
    id: "no-account",
    question: "I don't have login credentials yet.",
    answer:
      "Accounts are created by your school's administrator or registrar. If you're expecting access and haven't received credentials, contact the GWC IT Office.",
  },
  {
    id: "contact",
    question: "Who do I contact for other issues?",
    answer:
      "Reach the GWC IT Office through the official institutional channels listed on the Golden West Colleges, Inc. website.",
  },
];

export default function Help() {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-x-clip bg-cream-50 dark:bg-surface">
        {/* Ambient background */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
          <div className="blueprint-grid absolute inset-0 text-navy-900/6 dark:text-mist-100/5" />
          <div
            className="absolute -top-40 left-1/2 size-160 -translate-x-1/2 opacity-[0.12] dark:opacity-[0.08]"
            style={{ background: "radial-gradient(circle, rgb(212 175 55) 0%, transparent 65%)" }}
          />
        </div>

        <SiteHeader />

        {/* Full-width page title bar */}
        <div className="relative z-10 border-b border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl tracking-wide text-navy-700 dark:text-mist-100 sm:text-[2.75rem]">
              Help
            </h1>
          </div>
        </div>

        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-surface-overlay/60">
            <div className="border-b border-slate-200 px-8 py-8 dark:border-white/10 sm:px-12">
              <p className="font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
                Answers to common questions about signing in and using GWC Class Scheduling.
              </p>
            </div>
            <div className="divide-y divide-slate-100 px-8 dark:divide-white/5 sm:px-12">
              {FAQS.map((faq) => (
                <section key={faq.id} id={faq.id} className="scroll-mt-24 py-8">
                  <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    {faq.question}
                  </h2>
                  <p className="mt-3 font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {faq.answer}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

import { ThemeProvider } from "~/components/theme/theme-provider";
import { SiteHeader } from "~/landing/site-header";
import { SiteFooter } from "~/landing/site-footer";

export function meta() {
  return [
    { title: "Contact Us — GWC Class Scheduling" },
    { name: "description", content: "How to reach Golden West Colleges, Inc. about GWC Class Scheduling." },
  ];
}

const SECTIONS = [
  {
    id: "technical-support",
    heading: "Technical Support",
    body: "Having trouble signing in, or something on the platform isn't working as expected? Reach the GWC IT Office through the official institutional channels listed on the Golden West Colleges, Inc. website.",
  },
  {
    id: "account-access",
    heading: "Account & Access",
    body: "Accounts are issued by your school's administrator or registrar. If you're expecting access to GWC Class Scheduling and haven't received your login credentials, contact the GWC IT Office or the Office of the Registrar.",
  },
  {
    id: "general-inquiries",
    heading: "General Inquiries",
    body: "For questions about Golden West Colleges, Inc. that aren't related to the scheduling platform itself, please use the general contact channels listed on the Golden West Colleges, Inc. website.",
  },
];

export default function ContactUs() {
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
              Contact Us
            </h1>
          </div>
        </div>

        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-surface-overlay/60">
            <div className="border-b border-slate-200 px-8 py-8 dark:border-white/10 sm:px-12">
              <p className="font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
                Here's who to reach out to depending on what you need help with.
              </p>
            </div>
            <div className="divide-y divide-slate-100 px-8 dark:divide-white/5 sm:px-12">
              {SECTIONS.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24 py-8">
                  <h2 className="font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    {s.heading}
                  </h2>
                  <p className="mt-3 font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {s.body}
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

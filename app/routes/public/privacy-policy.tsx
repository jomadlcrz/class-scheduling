import { ThemeProvider } from "~/components/theme/theme-provider";
import { SiteHeader } from "~/landing/site-header";
import { SiteFooter } from "~/landing/site-footer";

export function meta() {
  return [
    { title: "Privacy Policy — GWC Class Scheduling" },
    { name: "description", content: "Privacy Policy for GWC Class Scheduling." },
  ];
}

const SECTIONS = [
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: "We collect information you provide directly, such as your name, institutional email address, and employee or faculty ID when you create an account. We also collect usage data — pages visited, actions taken within the scheduling tool, and session timestamps — to improve the service.",
  },
  {
    id: "how-we-use-information",
    heading: "How We Use Your Information",
    body: "Your information is used solely to operate GWC Class Scheduling: authenticating your account, generating and storing timetable data, and sending transactional emails such as password resets. We do not sell or share your personal information with third parties for marketing purposes.",
  },
  {
    id: "data-retention",
    heading: "Data Retention",
    body: "Account and scheduling data is retained for as long as your account remains active. You may request deletion of your account and associated data by contacting the GWC IT Office. Certain records may be retained for a limited period to comply with institutional audit requirements.",
  },
  {
    id: "cookies",
    heading: "Cookies and Local Storage",
    body: "This application uses browser local storage to remember your theme preference (light or dark mode). No tracking or advertising cookies are set. Session authentication relies on secure, HTTP-only cookies that expire when you log out or after a period of inactivity.",
  },
  {
    id: "security",
    heading: "Security",
    body: "We implement industry-standard safeguards including encrypted data transmission (HTTPS) and hashed credential storage. Access to production systems is restricted to authorized GWC personnel. No system is completely secure, and we encourage you to use a strong, unique password.",
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. When we do, the revised date at the top of this page will change. Continued use of GWC Class Scheduling after changes take effect constitutes acceptance of the updated policy.",
  },
  {
    id: "contact",
    heading: "Contact",
    body: "Questions about this Privacy Policy can be directed to the GWC IT Office through the official institutional channels listed on the Golden West Colleges, Inc. website.",
  },
];

export default function PrivacyPolicy() {
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
              Privacy Policy
            </h1>
          </div>
        </div>

        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-sm border border-slate-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-surface-overlay/60">
            <div className="border-b border-slate-200 px-8 py-8 dark:border-white/10 sm:px-12">
              <p className="font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
                This Privacy Policy describes how GWC Class Scheduling collects, uses, and protects
                information about users of the scheduling platform operated by Golden West Colleges,
                Inc..
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

import { ThemeProvider } from "~/components/theme/theme-provider";
import { SiteHeader } from "~/landing/site-header";
import { SiteFooter } from "~/landing/site-footer";
import { createSeoMeta } from "~/lib/seo";

export function meta() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return createSeoMeta({
    title: "Frequently Asked Questions",
    path: "/faqs",
    description:
      "Frequently asked questions about GWC Class Scheduling, institutional accounts, timetable planning, and role access.",
    structuredData: faqSchema,
  });
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
      "Accounts are created by your school's administrator or registrar. If you're expecting access and haven't received credentials, contact the Office of the Registrar.",
  },
  {
    id: "who-can-access",
    question: "Who can use GWC Class Scheduling?",
    answer:
      "Access is limited to Golden West Colleges, Inc. personnel and students with valid institutional credentials — administrators, registrars, deans, instructors, and enrolled students each see a view scoped to their role.",
  },
  {
    id: "contact",
    question: "I still need help — who do I contact?",
    answer: "Visit the Contact Us page, or reach the Office of the Registrar through official institutional channels.",
  },
];

export default function Faqs() {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-x-clip bg-cream-50 dark:bg-surface">
        <SiteHeader />

        {/* Full-width page title bar */}
        <div className="relative z-10 border-b border-slate-200 bg-white dark:border-white/10 dark:bg-surface-raised">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <h1 className="font-display text-4xl tracking-wide text-navy-700 dark:text-mist-100 sm:text-[2.75rem]">
              FAQs
            </h1>
          </div>
        </div>

        <main className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <section aria-labelledby="faq-introduction" className="pb-8">
            <h2 id="faq-introduction" className="font-display text-2xl tracking-wide text-navy-700 dark:text-mist-100">
              Common questions
            </h2>
            <p className="mt-3 font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
              Answers to common questions about signing in and using GWC Class Scheduling.
            </p>
          </section>

          <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-white/10 dark:border-white/10">
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
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

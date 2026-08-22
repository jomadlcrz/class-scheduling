import type { ReactNode } from "react";
import { ThemeProvider } from "~/components/theme/theme-provider";
import { ClockIcon, FacebookIcon, MailIcon, MapPinIcon, PhoneIcon } from "~/components/ui/icons";
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

const OFFICE_HOURS = [
  ["Monday", "8:00 AM – 5:00 PM"],
  ["Tuesday", "8:00 AM – 5:00 PM"],
  ["Wednesday", "8:00 AM – 5:00 PM"],
  ["Thursday", "8:00 AM – 5:00 PM"],
  ["Friday", "8:00 AM – 5:00 PM"],
  ["Saturday", "8:00 AM – 12:00 PM"],
  ["Sunday", "Closed"],
] as const;

export default function ContactUs() {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-x-clip bg-cream-50 dark:bg-surface">
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

        <GetInTouch />

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

function GetInTouch() {
  return (
    <section className="relative z-10 border-y border-slate-200 bg-white py-14 dark:border-white/10 dark:bg-surface-raised">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-4xl tracking-wide text-navy-700 dark:text-mist-100 sm:text-5xl">
            Get in Touch
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-body text-sm leading-6 text-slate-600 dark:text-slate-300">
            Connect with Golden West Colleges through the details below.
          </p>
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
          <ContactDetail icon={<MapPinIcon size={22} />} label="Come see us">
            <address className="not-italic">Main Building</address>
          </ContactDetail>
          <ContactDetail icon={<PhoneIcon size={22} />} label="Give us a call">
            <a href="tel:+639165969881" className="rounded-sm hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-gold-300">
              0916 596 9881
            </a>
          </ContactDetail>
          <ContactDetail icon={<MailIcon size={22} />} label="Send us an email">
            <a href="mailto:goldenwest.colleges@yahoo.com.ph" className="break-all rounded-sm hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-gold-300">
              goldenwest.colleges@yahoo.com.ph
            </a>
          </ContactDetail>
          <ContactDetail icon={<FacebookIcon size={22} />} label="Visit us on Facebook">
            <a
              href="https://www.facebook.com/gwcalaminosofficial"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm hover:text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:hover:text-gold-300"
            >
              GWC Alaminos Official
            </a>
          </ContactDetail>
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-lg bg-cream-50 p-6 dark:bg-white/5">
          <div className="flex items-center justify-center gap-2 text-navy-700 dark:text-mist-100">
            <ClockIcon size={18} />
            <h3 className="font-body text-sm font-semibold">Office Hours</h3>
          </div>
          <dl className="mt-5 grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            {OFFICE_HOURS.map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between gap-4">
                <dt className="text-slate-600 dark:text-slate-300">{day}</dt>
                <dd className={hours === "Closed" ? "font-medium text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}>
                  {hours}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function ContactDetail({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-gold-600 dark:text-gold-300">{icon}</span>
      <div>
        <h3 className="font-body text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</h3>
        <div className="mt-1 font-body text-sm leading-6 text-navy-700 dark:text-mist-100">{children}</div>
      </div>
    </div>
  );
}

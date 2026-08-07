import { ThemeProvider } from "~/components/theme/theme-provider";
import { ChevronRightIcon, HelpCircleIcon, MailIcon } from "~/components/ui/icons";
import { AmbientBackground } from "~/components/ui/ambient-background";
import { SiteHeader } from "~/landing/site-header";
import { SiteFooter } from "~/landing/site-footer";

export function meta() {
  return [
    { title: "Help — GWC Class Scheduling" },
    { name: "description", content: "Help center for GWC Class Scheduling." },
  ];
}

const LINKS = [
  {
    href: "/faqs",
    icon: HelpCircleIcon,
    title: "FAQs",
    description: "Answers to common questions about signing in and using GWC Class Scheduling.",
  },
  {
    href: "/contact-us",
    icon: MailIcon,
    title: "Contact Us",
    description: "Reach the GWC IT Office or Registrar's Office for account access and support.",
  },
];

export default function Help() {
  return (
    <ThemeProvider>
      <div className="relative min-h-dvh overflow-x-clip bg-cream-50 dark:bg-surface">
        <AmbientBackground variant="page" />

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
          <p className="font-body text-sm leading-7 text-slate-600 dark:text-slate-300">
            What do you need help with?
          </p>

          <div className="mt-6 flex flex-col gap-4">
            {LINKS.map(({ href, icon: Icon, title, description }) => (
              <a
                key={href}
                href={href}
                className="group flex items-center gap-4 rounded-sm border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-md transition-colors duration-150 hover:border-gold-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 dark:border-white/10 dark:bg-surface-overlay/60 dark:hover:border-gold-400/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-navy-800/5 text-navy-700 dark:bg-white/5 dark:text-mist-100">
                  <Icon />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-xl tracking-wide text-navy-700 dark:text-mist-100">
                    {title}
                  </span>
                  <span className="mt-1 block font-body text-sm text-slate-500 dark:text-slate-400">
                    {description}
                  </span>
                </span>
                <span className="shrink-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-slate-500">
                  <ChevronRightIcon />
                </span>
              </a>
            ))}
          </div>
        </main>

        <SiteFooter />
      </div>
    </ThemeProvider>
  );
}

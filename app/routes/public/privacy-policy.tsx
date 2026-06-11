import { LegalLayout, LegalSection } from "../../landing/legal-layout";

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
    <LegalLayout
      activePage="privacy-policy"
      title="Privacy Policy"
      intro="This Privacy Policy describes how GWC Class Scheduling collects, uses, and protects information about users of the scheduling platform operated by Golden West Colleges, Inc.."
    >
      {SECTIONS.map((s) => (
        <LegalSection key={s.id} id={s.id} heading={s.heading} body={s.body} />
      ))}
    </LegalLayout>
  );
}


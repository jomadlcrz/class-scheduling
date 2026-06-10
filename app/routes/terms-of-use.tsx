import { LegalLayout, LegalSection } from "../landing/legal-layout";

export function meta() {
  return [
    { title: "Terms of Use — GWC Class Scheduling" },
    { name: "description", content: "Terms of Use for GWC Class Scheduling." },
  ];
}

const SECTIONS = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    body: "By accessing or using GWC Class Scheduling, you agree to be bound by these Terms of Use. If you do not agree, you may not use the service. These terms apply to all users, including faculty, administrative staff, and any other personnel granted access by Golden West Colleges, Inc..",
  },
  {
    id: "authorized-use",
    heading: "Authorized Use",
    body: "GWC Class Scheduling is provided exclusively for creating, managing, and publishing academic timetables for Golden West Colleges, Inc.. Access is limited to individuals with valid institutional credentials issued by the GWC IT Office. Sharing credentials with unauthorized persons is prohibited.",
  },
  {
    id: "account-responsibilities",
    heading: "Account Responsibilities",
    body: "You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify the GWC IT Office immediately if you suspect unauthorized access. GWC is not liable for loss or damage arising from your failure to protect your credentials.",
  },
  {
    id: "prohibited-activities",
    heading: "Prohibited Activities",
    body: "You may not: (a) attempt to gain unauthorized access to any part of the system; (b) disrupt, degrade, or interfere with the service; (c) use automated scripts or bots to access the platform; (d) reproduce, distribute, or create derivative works from any content without written permission from GWC administration.",
  },
  {
    id: "intellectual-property",
    heading: "Intellectual Property",
    body: "All content, software, and data within GWC Class Scheduling — including timetable structures, design elements, and underlying code — are the property of Golden West Colleges, Inc. or its licensors. Nothing in these Terms grants you any rights to use GWC's trademarks, logos, or proprietary marks.",
  },
  {
    id: "disclaimer",
    heading: "Disclaimer of Warranties",
    body: 'GWC Class Scheduling is provided on an "as is" basis without warranties of any kind, express or implied. GWC does not warrant that the service will be uninterrupted, error-free, or free from security vulnerabilities. Published schedules should be verified through official channels before being communicated to students.',
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: "To the fullest extent permitted by applicable law, Golden West Colleges, Inc. shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use GWC Class Scheduling, including scheduling conflicts, data loss, or service outages.",
  },
  {
    id: "termination",
    heading: "Termination",
    body: "GWC reserves the right to suspend or terminate your access at any time, with or without notice, for conduct that violates these Terms or is otherwise harmful to the institution, other users, or the integrity of the scheduling system.",
  },
  {
    id: "changes",
    heading: "Changes to These Terms",
    body: "We may revise these Terms of Use periodically. The effective date at the top of this page will reflect the most recent update. Continued use of the service after changes take effect constitutes acceptance of the revised terms.",
  },
  {
    id: "contact",
    heading: "Contact",
    body: "Questions regarding these Terms of Use should be directed to the GWC IT Office or the Office of the Registrar through official institutional channels listed on the Golden West Colleges, Inc. website.",
  },
];

export default function TermsOfUse() {
  return (
    <LegalLayout
      activePage="terms-of-use"
      title="Terms of Use"
      intro="These Terms of Use govern your access to and use of GWC Class Scheduling, a timetable management platform operated by Golden West Colleges, Inc.. Please read them carefully."
    >
      {SECTIONS.map((s) => (
        <LegalSection key={s.id} id={s.id} heading={s.heading} body={s.body} />
      ))}
    </LegalLayout>
  );
}

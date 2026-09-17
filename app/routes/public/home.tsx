import type { Route } from "./+types/home";
import { Landing } from "~/landing/landing";
import { createSeoMeta, getCompleteStructuredDataGraph } from "~/lib/seo";

export function meta({}: Route.MetaArgs) {
  return createSeoMeta({
    title: "GWC Class Scheduling",
    brandSuffix: false,
    path: "/",
    description:
      "Build conflict-free academic timetables in minutes. GWC Class Scheduling turns rooms, faculty, and sections into a clean, published weekly plan.",
    structuredData: getCompleteStructuredDataGraph(),
  });
}

export default function Home() {
  return <Landing />;
}


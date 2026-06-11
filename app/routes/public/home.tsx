import type { Route } from "./+types/home";
import { Landing } from "../../landing/landing";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "GWC Class Scheduling" },
    {
      name: "description",
      content:
        "Build conflict-free academic timetables in minutes. GWC Class Scheduling turns rooms, faculty, and sections into a clean, published weekly plan.",
    },
  ];
}

export default function Home() {
  return <Landing />;
}


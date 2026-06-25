import { redirect } from "react-router";

/** Bare /schedules has no page — send visitors to the default submenu entry. */
export function loader() {
  return redirect("/schedules/regular-class");
}

export default function SchedulesIndexRoute() {
  return null;
}

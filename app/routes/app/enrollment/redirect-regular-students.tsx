import { redirect } from "react-router";

/** Old cohort route — the unified Enrollment Records directory now covers it, pre-filtered to Regular. */
export function loader() {
  return redirect("/enrollment/students?type=Regular");
}

export default function RedirectRegularStudentsRoute() {
  return null;
}

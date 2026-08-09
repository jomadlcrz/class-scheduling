import { redirect } from "react-router";

/** Old cohort route — the unified Enrollment Records directory now covers it, pre-filtered to Irregular. */
export function loader() {
  return redirect("/enrollment/students?type=Irregular");
}

export default function RedirectIrregularStudentsRoute() {
  return null;
}

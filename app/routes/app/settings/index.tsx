import { redirect } from "react-router";

/** The /settings hub was removed — desktop navigates via the settings sidebar
 * and mobile via "Your account". Land visitors on the first section. */
export function loader() {
  return redirect("/settings/profile");
}

export default function SettingsIndexRoute() {
  return null;
}

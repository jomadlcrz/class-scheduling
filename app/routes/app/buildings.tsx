import { Navigate } from "react-router";

/** Legacy URL — facilities live under /facilities. */
export default function BuildingsRedirect() {
  return <Navigate to="/facilities" replace />;
}

import { Navigate } from "react-router";

/** Legacy URL — facilities live on /facilities. */
export default function BuildingDetailRedirect() {
  return <Navigate to="/facilities" replace />;
}

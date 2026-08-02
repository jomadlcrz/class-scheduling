import { Navigate } from "react-router";

/** Legacy URL — create facility lives on /facilities/new. */
export default function CreateBuildingRedirect() {
  return <Navigate to="/facilities/new" replace />;
}

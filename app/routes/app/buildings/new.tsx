import { Navigate } from "react-router";

/** Legacy URL — create building lives under /facilities/new. */
export default function CreateBuildingRedirect() {
  return <Navigate to="/facilities/new" replace />;
}

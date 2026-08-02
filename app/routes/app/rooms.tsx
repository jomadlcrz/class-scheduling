import { Navigate } from "react-router";

/** Legacy URL — rooms live under /facilities. */
export default function RoomsRedirect() {
  return <Navigate to="/facilities" replace />;
}

import { Navigate } from "react-router";

/** Legacy route — redirects to Academic Terms. */
export default function AcademicTermRedirect() {
  return <Navigate to="/academic-terms" replace />;
}

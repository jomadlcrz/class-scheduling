import { Navigate, useParams } from "react-router";

/** Legacy edit URL — building view lives on /facilities?buildingId=:id */
export default function BuildingDetailRedirect() {
  const { buildingId } = useParams();
  return <Navigate to={`/facilities?buildingId=${buildingId ?? ""}`} replace />;
}

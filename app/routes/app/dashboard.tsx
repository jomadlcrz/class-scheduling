import { useAuth } from "../../hooks/use-auth";
import { PageHeader } from "../../layouts/page-header";

export function meta() {
  return [
    { title: 'Dashboard — GWC Class Scheduling' },
  ];
}

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={user ? `Welcome back, ${user.name}.` : "Overview of the current academic term."}
      />
    </>
  );
}

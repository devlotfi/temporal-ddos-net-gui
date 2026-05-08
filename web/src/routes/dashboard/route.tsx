import { createFileRoute, Outlet } from "@tanstack/react-router";
import { dashboardSearchSchema } from "../../types/dashboard-search-schema";
import DashboardNavbar from "../../components/dashboard-navbar";

export const Route = createFileRoute("/dashboard")({
  validateSearch: dashboardSearchSchema,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardNavbar></DashboardNavbar>
      <div className="flex flex-col h-[calc(100dvh-6rem)] overflow-y-auto">
        <Outlet></Outlet>
      </div>
    </div>
  );
}

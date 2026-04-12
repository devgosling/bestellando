import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardSidebar } from "../../../components/dashboard/DashboardSidebar";

function DashboardLayout() {
  return (
    <div className="flex min-h-dvh">
      <DashboardSidebar />
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

export const Route = createFileRoute("/(protected-restaurant)/dashboard")({
  component: DashboardLayout,
  staticData: {
    showHeader: true,
    showFooter: false,
  },
});

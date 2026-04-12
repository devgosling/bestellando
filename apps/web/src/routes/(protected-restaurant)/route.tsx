import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureAuthenticated } from "../../providers/route-guard";

const ProtectedRestaurantLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(protected-restaurant)")({
  component: ProtectedRestaurantLayout,
  beforeLoad: async (options) => {
    await ensureAuthenticated(
      options.context,
      options.location.pathname,
      "RESTAURANT",
    );
  },
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureAuthenticated } from "../../providers/route-guard";

const ProtectedDeliveryLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(protected-delivery)")({
  component: ProtectedDeliveryLayout,
  beforeLoad: async (options) => {
    await ensureAuthenticated(
      options.context,
      options.location.pathname,
      "DELIVERY_PERSON",
    );
  },
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

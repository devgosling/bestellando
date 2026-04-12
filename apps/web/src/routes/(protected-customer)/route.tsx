import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureAuthenticated } from "../../providers/route-guard";

const ProtectedCustomerLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(protected-customer)")({
  component: ProtectedCustomerLayout,
  beforeLoad: async (options) => {
    await ensureAuthenticated(
      options.context,
      options.location.pathname,
      "CUSTOMER",
    );
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@repo/hooks";

const Page = () => {
  return <div>Manage Restaurant Page</div>;
};

export const Route = createFileRoute("/(protected-restaurant)/manage-restaurant")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

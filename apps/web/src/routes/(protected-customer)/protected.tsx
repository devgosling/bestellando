import { createFileRoute } from "@tanstack/react-router";

const Page = () => {
  return (
    <div className="p-5 h-auto flex flex-column align-items-center gap-4">
      This is a protected page. You should only see this if you are logged in as
      a customer.
    </div>
  );
};

export const Route = createFileRoute("/(protected-customer)/protected")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

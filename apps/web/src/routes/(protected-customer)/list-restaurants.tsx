import { createFileRoute } from "@tanstack/react-router";

const Page = () => {
  return <div>List of Restaurants Page</div>;
};

export const Route = createFileRoute("/(protected-customer)/list-restaurants")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import { RestaurantSettingsForm } from "../../../../components/dashboard/RestaurantSettingsForm";

function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: restaurants, isLoading } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  const updateMutation = useApiMutation<
    RestaurantEntity,
    Error,
    Record<string, unknown>
  >({
    request: {
      url: `/v1/restaurant/${restaurant?.$id}`,
      method: "PATCH",
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "mine"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton count={4} type="row" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6 text-center text-muted">
        Kein Restaurant gefunden.
      </div>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Einstellungen</h1>
        <p className="text-sm text-muted">
          Restaurantprofil und Lieferoptionen anpassen
        </p>
      </div>

      <RestaurantSettingsForm
        restaurant={restaurant}
        onSubmit={(data) => updateMutation.mutate(data)}
        isLoading={updateMutation.isPending}
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/settings/",
)({
  component: SettingsPage,
  staticData: { showHeader: true, showFooter: false },
});

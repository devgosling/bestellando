import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApiQuery } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@repo/lib";
import type { RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import {
  RestaurantSettingsForm,
  type SettingsFormData,
} from "../../../../components/dashboard/RestaurantSettingsForm";

function SettingsPage() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: restaurants, isLoading } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  const handleSubmit = async (data: SettingsFormData) => {
    if (!restaurant) return;
    setIsSaving(true);
    try {
      await authenticatedFetch(`/v1/restaurant/${restaurant.$id}`, {
        method: "PATCH",
        body: JSON.stringify(data.restaurant),
      });

      const addressId = restaurant.address?.$id;
      if (addressId) {
        await authenticatedFetch(`/v1/address/${addressId}`, {
          method: "PATCH",
          body: JSON.stringify(data.address),
        });
      } else {
        const created = (await authenticatedFetch("/v1/address", {
          method: "POST",
          body: JSON.stringify({
            ...data.address,
            ownerType: "RESTAURANT",
          }),
        })) as { $id: string };
        await authenticatedFetch(`/v1/restaurant/${restaurant.$id}`, {
          method: "PATCH",
          body: JSON.stringify({ address: created.$id }),
        });
      }

      queryClient.invalidateQueries({ queryKey: ["restaurant", "mine"] });
    } finally {
      setIsSaving(false);
    }
  };

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
        onSubmit={handleSubmit}
        isLoading={isSaving}
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

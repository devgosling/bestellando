import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useApiQuery } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@repo/lib";
import type { AddressEntity, RestaurantEntity } from "@repo/interfaces";
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

  const addressIdFromRestaurant = useMemo(() => {
    const a = restaurant?.address as AddressEntity | string | undefined;
    if (!a) return undefined;
    return typeof a === "string" ? a : a.$id;
  }, [restaurant]);

  const { data: addresses } = useApiQuery<AddressEntity[]>({
    request: { url: "/v1/address" },
    queryKey: ["addresses", "mine"],
    enabled: !!restaurant,
  });

  const restaurantAddress = useMemo<AddressEntity | undefined>(() => {
    if (restaurant?.address && typeof restaurant.address === "object") {
      return restaurant.address as AddressEntity;
    }
    if (addressIdFromRestaurant && addresses) {
      return addresses.find((a) => a.$id === addressIdFromRestaurant);
    }
    return addresses?.find((a) => a.ownerType === "RESTAURANT");
  }, [restaurant, addresses, addressIdFromRestaurant]);

  const handleSubmit = async (data: SettingsFormData) => {
    if (!restaurant) return;
    setIsSaving(true);
    try {
      await authenticatedFetch(`/v1/restaurant/${restaurant.$id}`, {
        method: "PATCH",
        body: JSON.stringify(data.restaurant),
      });

      const addressId = restaurantAddress?.$id ?? addressIdFromRestaurant;
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
      queryClient.invalidateQueries({ queryKey: ["addresses", "mine"] });
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
        address={restaurantAddress}
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

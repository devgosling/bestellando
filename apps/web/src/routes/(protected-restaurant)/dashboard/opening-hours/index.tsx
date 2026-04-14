import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { authenticatedFetch } from "@repo/lib";
import type { OpeningHoursEntity, RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import {
  OpeningHoursEditor,
  type DayRow,
} from "../../../../components/dashboard/OpeningHoursEditor";

function OpeningHoursPage() {
  const queryClient = useQueryClient();

  const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  const { data: hours, isLoading } = useApiQuery<OpeningHoursEntity[]>({
    request: { url: `/v1/opening-hours?restaurantId=${restaurant?.$id}` },
    queryKey: ["opening-hours", restaurant?.$id],
    enabled: !!restaurant?.$id,
  });

  const saveMutation = useApiMutation<void, Error, DayRow[]>({
    mutationFn: async (rows) => {
      const restaurantId = restaurant?.$id;
      if (!restaurantId) {
        throw new Error("Restaurant noch nicht geladen");
      }
      const existingHours = hours ?? [];
      const promises: Promise<unknown>[] = [];

      for (const row of rows) {
        const existingForDay = existingHours.filter(
          (h) => h.dayOfWeek === row.dayOfWeek,
        );

        if (row.isClosed) {
          for (const h of existingForDay) {
            promises.push(
              authenticatedFetch(`/v1/opening-hours/${h.$id}`, {
                method: "DELETE",
              }),
            );
          }
          continue;
        }

        const keptIds = new Set<string>();
        for (const slot of row.slots) {
          const body = JSON.stringify({
            dayOfWeek: row.dayOfWeek,
            openTime: slot.openTime,
            closeTime: slot.closeTime,
            restaurant: restaurantId,
          });

          if (slot.entityId) {
            keptIds.add(slot.entityId);
            promises.push(
              authenticatedFetch(`/v1/opening-hours/${slot.entityId}`, {
                method: "PATCH",
                body,
              }),
            );
          } else {
            promises.push(
              authenticatedFetch("/v1/opening-hours", {
                method: "POST",
                body,
              }),
            );
          }
        }

        for (const h of existingForDay) {
          if (!keptIds.has(h.$id)) {
            promises.push(
              authenticatedFetch(`/v1/opening-hours/${h.$id}`, {
                method: "DELETE",
              }),
            );
          }
        }
      }

      await Promise.all(promises);
    },
    success: () => {
      queryClient.invalidateQueries({
        queryKey: ["opening-hours", restaurant?.$id],
      });
    },
  });

  if (isLoading || !restaurant) {
    return (
      <div className="p-6">
        <LoadingSkeleton count={7} type="row" />
      </div>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Öffnungszeiten</h1>
        <p className="text-sm text-muted">
          Lege fest, wann dein Restaurant geöffnet ist
        </p>
      </div>

      <OpeningHoursEditor
        hours={hours ?? []}
        restaurantId={restaurant?.$id ?? ""}
        onSave={(rows) => saveMutation.mutate(rows)}
        isLoading={saveMutation.isPending}
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/opening-hours/",
)({
  component: OpeningHoursPage,
  staticData: { showHeader: true, showFooter: false },
});

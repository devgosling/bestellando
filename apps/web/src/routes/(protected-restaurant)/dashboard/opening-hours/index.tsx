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
    request: { url: "/v1/opening-hours" },
    queryKey: ["opening-hours"],
    enabled: !!restaurant,
  });

  const saveMutation = useApiMutation<void, Error, DayRow[]>({
    mutationFn: async (rows) => {
      const existingHours = hours ?? [];

      const promises = rows.map((row) => {
        const existing = existingHours.find(
          (h) => h.dayOfWeek === row.dayOfWeek,
        );

        if (row.isClosed && existing) {
          return authenticatedFetch(`/v1/opening-hours/${existing.$id}`, {
            method: "DELETE",
          });
        }

        if (row.isClosed) {
          return Promise.resolve();
        }

        const body = JSON.stringify({
          dayOfWeek: row.dayOfWeek,
          openTime: row.openTime,
          closeTime: row.closeTime,
          restaurantId: restaurant?.$id,
        });

        if (existing) {
          return authenticatedFetch(`/v1/opening-hours/${existing.$id}`, {
            method: "PATCH",
            body,
          });
        }

        return authenticatedFetch("/v1/opening-hours", {
          method: "POST",
          body,
        });
      });

      await Promise.all(promises);
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["opening-hours"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton count={7} type="row" />
      </div>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Oeffnungszeiten</h1>
        <p className="text-sm text-muted">
          Lege fest, wann dein Restaurant geoeffnet ist
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

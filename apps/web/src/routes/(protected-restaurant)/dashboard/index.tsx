import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import type { RestaurantEntity } from "@repo/interfaces";
import { ListCheck, CircleDollar, Clock } from "@gravity-ui/icons";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { StatCard } from "../../../components/dashboard/StatCard";

function OverviewPage() {
  const { data: restaurants, isLoading } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton count={3} type="row" />
      </div>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {restaurant?.name ?? "Dashboard"}
        </h1>
        <p className="text-sm text-muted">
          Willkommen in deinem Restaurant-Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Bestellungen heute"
          value="--"
          subtitle="Wird mit WebSocket aktualisiert"
          icon={<ListCheck className="size-5" />}
        />
        <StatCard
          title="Umsatz heute"
          value="--"
          subtitle="Wird mit WebSocket aktualisiert"
          icon={<CircleDollar className="size-5" />}
        />
        <StatCard
          title="Durchschn. Lieferzeit"
          value={
            restaurant
              ? `${restaurant.estimatedDeliveryMinutes} Min.`
              : "--"
          }
          subtitle="Konfiguriert in Einstellungen"
          icon={<Clock className="size-5" />}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Letzte Bestellungen</h2>
        <div className="rounded-lg border border-border p-8 text-center text-muted">
          Bestellungen werden ueber WebSocket empfangen.
          <br />
          Echtzeitdaten werden in Phase 5 verfuegbar sein.
        </div>
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-restaurant)/dashboard/")({
  component: OverviewPage,
  staticData: { showHeader: true, showFooter: false },
});

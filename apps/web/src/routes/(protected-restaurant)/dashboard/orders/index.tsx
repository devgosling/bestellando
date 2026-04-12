import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus } from "@repo/interfaces";
import { ListCheck } from "@gravity-ui/icons";
import { getOrderSocket } from "@repo/lib";
import { useApiQuery } from "@repo/hooks";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { useSocketEvent } from "../../../../hooks/useSocketEvent";

import type { RestaurantEntity } from "@repo/interfaces";

type FilterTab = "ALL" | OrderStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Alle" },
  { key: "PENDING", label: "Ausstehend" },
  { key: "CONFIRMED", label: "Bestaetigt" },
  { key: "PREPARING", label: "In Zubereitung" },
  { key: "READY", label: "Bereit" },
];

function OrdersPage() {
  const [_filter, setFilter] = useState<FilterTab>("ALL");
  const queryClient = useQueryClient();
  const orderSocket = getOrderSocket();

  const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurantId = restaurants?.[0]?.$id;

  // Subscribe to restaurant room for new orders
  useEffect(() => {
    if (orderSocket && restaurantId) {
      orderSocket.emit("subscribe:restaurant", { restaurantId });
    }
  }, [orderSocket, restaurantId]);

  // Listen for new incoming orders
  useSocketEvent(orderSocket, "order:new", () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
  });

  // Listen for status changes on existing orders
  useSocketEvent(orderSocket, "order:status-changed", () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
  });

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bestellungen</h1>
        <p className="text-sm text-default-500">
          Eingehende und aktive Bestellungen verwalten
        </p>
      </div>

      <Tabs
        selectedKey={_filter}
        onSelectionChange={(key) => setFilter(key as FilterTab)}
        variant="underlined"
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>

      <EmptyState
        title="Keine Bestellungen"
        description="Bestellungen werden ueber WebSocket empfangen. Echtzeitdaten werden in Phase 5 verfuegbar sein."
        icon={<ListCheck className="size-12" />}
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/orders/",
)({
  component: OrdersPage,
  staticData: { showHeader: true, showFooter: false },
});

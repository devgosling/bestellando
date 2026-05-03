import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Tabs,
  TabList,
  Tab,
  Card,
  CardContent,
  Chip,
  Button,
  Spinner,
} from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  DeliveryAssignedEvent,
  OrderStatus,
  RestaurantEntity,
} from "@repo/interfaces";
import { ListCheck, Person, Smartphone } from "@gravity-ui/icons";
import { authenticatedFetch, connectSockets, getOrderSocket } from "@repo/lib";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { PriceDisplay } from "../../../../components/shared/PriceDisplay";
import { useSocketEvent } from "../../../../hooks/useSocketEvent";
import { ProofImage } from "../../../../components/delivery/ProofImage";

const vehicleLabels: Record<string, string> = {
  BICYCLE: "Fahrrad",
  SCOOTER: "Roller",
  CAR: "Auto",
};

const ORDERS_WITH_DRIVER: OrderStatus[] = ["READY", "PICKED_UP", "DELIVERED"];

type FilterTab = "ALL" | OrderStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Alle" },
  { key: "PENDING", label: "Ausstehend" },
  { key: "CONFIRMED", label: "Bestätigt" },
  { key: "PREPARING", label: "In Zubereitung" },
  { key: "READY", label: "Bereit" },
];

const statusColors: Record<string, "warning" | "primary" | "secondary" | "success" | "default"> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PREPARING: "secondary",
  READY: "success",
};

const nextStatusMap: Record<string, OrderStatus> = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
};

function OrdersPage() {
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const queryClient = useQueryClient();
  const [orderSocket, setOrderSocket] = useState(() => getOrderSocket());

  useEffect(() => {
    if (orderSocket) return;
    let cancelled = false;
    connectSockets()
      .then(() => {
        if (!cancelled) setOrderSocket(getOrderSocket());
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [orderSocket]);

  const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurantId = restaurants?.[0]?.$id;

  const { data: ordersData, isLoading } = useApiQuery<{
    data: any[];
    total: number;
  }>({
    request: { url: `/v1/order/restaurant/${restaurantId}` },
    queryKey: ["restaurant-orders", restaurantId],
    enabled: !!restaurantId,
  });

  const updateStatus = useApiMutation<
    { success: boolean },
    Error,
    { orderId: string; status: OrderStatus }
  >({
    mutationFn: async (vars) => {
      const { authenticatedFetch } = await import("@repo/lib");
      return authenticatedFetch(`/v1/order/${vars.orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
    },
  });

  type CardDelivery = {
    deliveryId?: string;
    driver?: DeliveryAssignedEvent;
    proofImageId?: string;
  };
  const [deliveries, setDeliveries] = useState<Record<string, CardDelivery>>(
    {},
  );

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

  useSocketEvent<DeliveryAssignedEvent>(
    orderSocket,
    "delivery:assigned",
    (data) => {
      setDeliveries((prev) => ({
        ...prev,
        [data.orderId]: { ...prev[data.orderId], driver: data },
      }));
    },
  );

  const orders = ordersData?.data ?? [];

  // Hydrate driver info / proof image for accepted orders on initial load
  useEffect(() => {
    let cancelled = false;
    orders.forEach(async (order: any) => {
      if (deliveries[order.$id]?.driver) return;
      if (!ORDERS_WITH_DRIVER.includes(order.currentStatus)) return;
      try {
        const delivery = (await authenticatedFetch(
          `/v1/delivery/order/${order.$id}`,
        )) as {
          $id: string;
          proofImageId?: string;
          deliveryPerson?: any;
        } | null;
        if (cancelled || !delivery) return;
        const dp = delivery.deliveryPerson;
        setDeliveries((prev) => ({
          ...prev,
          [order.$id]: {
            deliveryId: delivery.$id,
            proofImageId: delivery.proofImageId,
            driver: dp
              ? {
                  orderId: order.$id,
                  driverId: dp.$id,
                  driverName: dp.name,
                  driverPhone: dp.phone,
                  vehicleType: dp.vehicleType,
                  estimatedMinutes: 0,
                }
              : prev[order.$id]?.driver,
          },
        }));
      } catch {
        // ignore
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orders]);
  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter((o: any) => o.currentStatus === filter);

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bestellungen</h1>
        <p className="text-sm text-muted">
          Eingehende und aktive Bestellungen verwalten
        </p>
      </div>

      <Tabs
        selectedKey={filter}
        onSelectionChange={(key) => setFilter(key as FilterTab)}
        variant="underlined"
      >
        <TabList>
          {tabs.map((tab) => (
            <Tab key={tab.key} id={tab.key}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          title="Keine Bestellungen"
          description="Neue Bestellungen erscheinen hier automatisch."
          icon={<ListCheck className="size-12" />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order: any) => (
            <Card key={order.$id}>
              <CardContent className="flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    Bestellung #{order.$id?.slice(-6)}
                  </p>
                  <PriceDisplay amount={order.totalAmount} />
                  {order.specialInstructions && (
                    <p className="text-xs text-muted">
                      {order.specialInstructions}
                    </p>
                  )}
                  {deliveries[order.$id]?.driver && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Person className="size-3" />
                        {deliveries[order.$id].driver!.driverName} (
                        {vehicleLabels[
                          deliveries[order.$id].driver!.vehicleType
                        ] ?? deliveries[order.$id].driver!.vehicleType}
                        )
                      </span>
                      <a
                        href={`tel:${deliveries[order.$id].driver!.driverPhone}`}
                        className="flex items-center gap-1 text-accent no-underline hover:underline"
                      >
                        <Smartphone className="size-3" />
                        {deliveries[order.$id].driver!.driverPhone}
                      </a>
                    </div>
                  )}
                  {deliveries[order.$id]?.proofImageId &&
                    deliveries[order.$id]?.deliveryId && (
                      <ProofImage
                        deliveryId={deliveries[order.$id].deliveryId!}
                      />
                    )}
                </div>
                <div className="flex items-center gap-3">
                  <Chip
                    color={statusColors[order.currentStatus] ?? "default"}
                    size="sm"
                    variant="flat"
                  >
                    {order.currentStatus}
                  </Chip>
                  {order.currentStatus === "PENDING" && (
                    <Button
                      size="sm"
                      color="success"
                      onPress={() =>
                        updateStatus.mutate({
                          orderId: order.$id,
                          status: "CONFIRMED",
                        })
                      }
                    >
                      Annehmen
                    </Button>
                  )}
                  {nextStatusMap[order.currentStatus] && (
                    <Button
                      size="sm"
                      className="bg-accent text-accent-foreground font-semibold"
                      onPress={() =>
                        updateStatus.mutate({
                          orderId: order.$id,
                          status: nextStatusMap[order.currentStatus],
                        })
                      }
                    >
                      {order.currentStatus === "CONFIRMED"
                        ? "Zubereiten"
                        : "Bereit"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/orders/",
)({
  component: OrdersPage,
  staticData: { showHeader: true, showFooter: false },
});

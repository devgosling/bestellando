import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ToggleSwitch } from "../../../components/shared/ToggleSwitch";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { connectSockets, getOrderSocket } from "@repo/lib";
import type {
  NewOrderEvent,
  OrderEntity,
  OrderStatusChangedEvent,
  RestaurantEntity,
} from "@repo/interfaces";
import { ListCheck, CircleDollar, Clock } from "@gravity-ui/icons";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { StatCard } from "../../../components/dashboard/StatCard";
import { useSocketEvent } from "../../../hooks/useSocketEvent";
import { PriceDisplay } from "../../../components/shared/PriceDisplay";
import type { Socket } from "socket.io-client";

function OverviewPage() {
  const { data: restaurants, isLoading } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];
  const restaurantId = restaurant?.$id;

  const { data: initialOrders } = useApiQuery<{
    data: OrderEntity[];
    total: number;
  }>({
    request: { url: `/v1/order/restaurant/${restaurantId}?limit=25` },
    queryKey: ["restaurant-orders", restaurantId],
    enabled: !!restaurantId,
  });

  const [orders, setOrders] = useState<OrderEntity[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  const toggleActiveMutation = useApiMutation<
    RestaurantEntity,
    Error,
    { isActive: boolean }
  >({
    request: {
      url: `/v1/restaurant/${restaurantId}`,
      method: "PATCH",
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", "mine"] });
    },
  });

  useEffect(() => {
    if (initialOrders?.data) setOrders(initialOrders.data);
  }, [initialOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    connectSockets()
      .then(() => {
        if (cancelled) return;
        const s = getOrderSocket();
        setSocket(s);
        s?.emit("subscribe:restaurant", { restaurantId });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useSocketEvent<NewOrderEvent>(socket, "order:new", (event) => {
    setOrders((prev) => [event.order, ...prev].slice(0, 50));
  });

  useSocketEvent<OrderStatusChangedEvent>(
    socket,
    "order:status-changed",
    (event) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.$id === event.orderId ? { ...o, currentStatus: event.newStatus } : o,
        ),
      );
    },
  );

  const todayStats = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todays = orders.filter((o) => {
      const created = o.createdAt ? new Date(o.createdAt) : null;
      return created && created >= startOfDay;
    });
    const revenue = todays
      .filter((o) => o.currentStatus !== "CANCELLED")
      .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
    return { count: todays.length, revenue };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton count={3} type="row" />
      </div>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {restaurant?.name ?? "Dashboard"}
          </h1>
          <p className="text-sm text-muted">
            Willkommen in deinem Restaurant-Dashboard
          </p>
        </div>
        {restaurant && (
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-2">
            <span
              className={`size-2 rounded-full ${
                restaurant.isActive ? "bg-success" : "bg-muted"
              }`}
            />
            <ToggleSwitch
              isSelected={restaurant.isActive}
              onChange={(v) => toggleActiveMutation.mutate({ isActive: v })}
              isDisabled={toggleActiveMutation.isPending}
            >
              <span className="text-sm">
                {restaurant.isActive ? "Geöffnet" : "Geschlossen"}
              </span>
            </ToggleSwitch>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Bestellungen heute"
          value={String(todayStats.count)}
          subtitle="Live aktualisiert"
          icon={<ListCheck className="size-5" />}
        />
        <StatCard
          title="Umsatz heute"
          value={<PriceDisplay amount={todayStats.revenue} />}
          subtitle="Live aktualisiert"
          icon={<CircleDollar className="size-5" />}
        />
        <StatCard
          title="Durchschn. Lieferzeit"
          value={
            restaurant ? `${restaurant.estimatedDeliveryMinutes} Min.` : "--"
          }
          subtitle="Konfiguriert in Einstellungen"
          icon={<Clock className="size-5" />}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Letzte Bestellungen</h2>
        {orders.length === 0 ? (
          <div className="rounded-lg border border-border p-8 text-center text-muted">
            Noch keine Bestellungen.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.slice(0, 10).map((order) => (
              <li
                key={order.$id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    #{order.$id.slice(-6).toUpperCase()}
                  </span>
                  <span className="text-xs text-muted">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs">
                    {order.currentStatus}
                  </span>
                  <PriceDisplay amount={order.totalAmount} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-restaurant)/dashboard/")({
  component: OverviewPage,
  staticData: { showHeader: true, showFooter: false },
});

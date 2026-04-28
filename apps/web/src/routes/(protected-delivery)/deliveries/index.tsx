import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { ToggleSwitch } from "../../../components/shared/ToggleSwitch";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { authenticatedFetch, getDeliverySocket } from "@repo/lib";
import type {
  DeliveryPersonEntity,
  DeliveryAvailableEvent,
  DeliveryEntity,
} from "@repo/interfaces";
import { useSocketEvent } from "../../../hooks/useSocketEvent";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { DeliveryCard } from "../../../components/delivery/DeliveryCard";

function DeliveriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socket = getDeliverySocket();
  const [availableDeliveries, setAvailableDeliveries] = useState<
    DeliveryAvailableEvent[]
  >([]);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);

  const { data: profile, isLoading: isProfileLoading } =
    useApiQuery<DeliveryPersonEntity>({
      request: { url: "/v1/delivery-person/profile" },
      queryKey: ["delivery-person-profile"],
    });

  const toggleAvailability = useApiMutation<
    DeliveryPersonEntity,
    Error,
    { isAvailable: boolean }
  >({
    request: {
      url: "/v1/delivery-person/availability",
      method: "PATCH",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-person-profile"] });
    },
  });

  const handleToggle = useCallback(
    (isSelected: boolean) => {
      toggleAvailability.mutate({ isAvailable: isSelected });
      if (isSelected) {
        socket?.emit("driver:go-online");
      } else {
        socket?.emit("driver:go-offline");
        setAvailableDeliveries([]);
      }
    },
    [socket, toggleAvailability],
  );

  // Listen for new available orders
  useSocketEvent<DeliveryAvailableEvent>(
    socket,
    "delivery:available-order",
    useCallback((data: DeliveryAvailableEvent) => {
      setAvailableDeliveries((prev) => {
        if (prev.some((d) => d.orderId === data.orderId)) return prev;
        return [...prev, data];
      });
    }, []),
  );

  // Listen for orders taken by other drivers
  useSocketEvent<{ orderId: string }>(
    socket,
    "delivery:order-taken",
    useCallback((data: { orderId: string }) => {
      setAvailableDeliveries((prev) =>
        prev.filter((d) => d.orderId !== data.orderId),
      );
    }, []),
  );

  const handleAccept = useCallback(
    async (orderId: string) => {
      setAcceptingOrderId(orderId);
      try {
        const delivery = (await authenticatedFetch(
          `/v1/delivery/accept/${orderId}`,
          { method: "POST" },
        )) as DeliveryEntity;
        navigate({
          to: "/deliveries/$deliveryId",
          params: { deliveryId: delivery.$id },
        });
      } catch {
        setAcceptingOrderId(null);
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!profile?.isAvailable) return;
    let cancelled = false;
    (async () => {
      try {
        const result = (await authenticatedFetch(
          "/v1/delivery/available",
        )) as { data: DeliveryAvailableEvent[] };
        if (cancelled) return;
        setAvailableDeliveries((prev) => {
          const seen = new Set(prev.map((d) => d.orderId));
          return [...prev, ...result.data.filter((d) => !seen.has(d.orderId))];
        });
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.isAvailable]);

  if (isProfileLoading) {
    return (
      <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
        <LoadingSkeleton count={3} type="row" />
      </AnimatedPage>
    );
  }

  const isOnline = profile?.isAvailable ?? false;

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      {/* Online/Offline toggle */}
      <Card className="mb-6">
        <CardContent className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">
              {isOnline ? "Online" : "Offline"}
            </h1>
            <span className="text-sm text-muted">
              {isOnline
                ? "Du erhältst neue Lieferaufträge"
                : "Gehe online um Aufträge zu erhalten"}
            </span>
          </div>
          <ToggleSwitch
            isSelected={isOnline}
            onChange={handleToggle}
            color="success"
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Available deliveries */}
      {isOnline && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Verfügbare Lieferungen</h2>
          {availableDeliveries.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted">
                  Keine verfügbaren Lieferungen. Warte auf neue Aufträge...
                </p>
              </CardContent>
            </Card>
          ) : (
            availableDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.orderId}
                orderId={delivery.orderId}
                restaurantName={delivery.restaurantName}
                pickupAddress={delivery.pickupAddress}
                deliveryAddress={delivery.deliveryAddress}
                onAccept={handleAccept}
                isAccepting={acceptingOrderId === delivery.orderId}
              />
            ))
          )}
        </div>
      )}
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-delivery)/deliveries/")({
  component: DeliveriesPage,
  staticData: { showHeader: true, showFooter: true },
});

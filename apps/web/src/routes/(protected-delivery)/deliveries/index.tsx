import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Switch, Card, CardBody } from "@heroui/react";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { getDeliverySocket } from "@repo/lib";
import type {
  DeliveryPersonEntity,
  DeliveryAvailableEvent,
} from "@repo/interfaces";
import { useSocketEvent } from "../../../hooks/useSocketEvent";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { DeliveryCard } from "../../../components/delivery/DeliveryCard";

interface AvailableDelivery {
  orderId: string;
  restaurantName: string;
  pickupAddress: DeliveryAvailableEvent["pickupAddress"];
  deliveryAddress: DeliveryAvailableEvent["deliveryAddress"];
}

function DeliveriesPage() {
  const navigate = useNavigate();
  const socket = getDeliverySocket();
  const [availableDeliveries, setAvailableDeliveries] = useState<
    AvailableDelivery[]
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
  });

  const acceptDelivery = useApiMutation<
    { deliveryId: string },
    Error,
    { orderId: string }
  >({
    request: {
      url: "",
      method: "POST",
    },
    success: (data) => {
      navigate({
        to: "/deliveries/$deliveryId",
        params: { deliveryId: data.deliveryId },
      });
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
        const result = await authenticatedFetchDirect(
          `/v1/delivery/accept/${orderId}`,
          { method: "POST" },
        );
        navigate({
          to: "/deliveries/$deliveryId",
          params: { deliveryId: (result as { deliveryId: string }).deliveryId },
        });
      } catch {
        setAcceptingOrderId(null);
      }
    },
    [navigate],
  );

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
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold">
              {isOnline ? "Online" : "Offline"}
            </h1>
            <span className="text-sm text-default-500">
              {isOnline
                ? "Du erhaeltst neue Lieferauftraege"
                : "Gehe online um Auftraege zu erhalten"}
            </span>
          </div>
          <Switch
            isSelected={isOnline}
            onValueChange={handleToggle}
            color="success"
            size="lg"
          />
        </CardBody>
      </Card>

      {/* Available deliveries */}
      {isOnline && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Verfuegbare Lieferungen</h2>
          {availableDeliveries.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-default-400">
                  Keine verfuegbaren Lieferungen. Warte auf neue Auftraege...
                </p>
              </CardBody>
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

// Direct fetch helper to avoid mutation boilerplate for accept
async function authenticatedFetchDirect(
  url: string,
  init: RequestInit,
): Promise<unknown> {
  const { authenticatedFetch } = await import("@repo/lib");
  return authenticatedFetch(url, init);
}

export const Route = createFileRoute("/(protected-delivery)/deliveries/")({
  component: DeliveriesPage,
  staticData: { showHeader: true, showFooter: true },
});

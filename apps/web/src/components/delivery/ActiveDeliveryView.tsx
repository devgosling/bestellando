import { useEffect, useState } from "react";
import { Card, CardContent, Chip } from "@heroui/react";
import { getDeliverySocket } from "@repo/lib";
import type { DeliveryEntity, OrderEntity } from "@repo/interfaces";
import { NavigationMap } from "./NavigationMap";
import { DeliveryActionBar } from "./DeliveryActionBar";

type LatLng = [number, number];

interface ActiveDeliveryViewProps {
  delivery: DeliveryEntity;
  order: OrderEntity;
  onPickup: () => void;
  onDeliver: () => void;
  isActionLoading?: boolean;
}

function getDestination(
  delivery: DeliveryEntity,
  order: OrderEntity,
): { position: LatLng; label: string } | null {
  const restaurantAddr = order.restaurant?.address;
  if (
    delivery.status === "ASSIGNED" &&
    restaurantAddr &&
    typeof restaurantAddr !== "string"
  ) {
    const coords = restaurantAddr.coordinates as unknown as
      | { coordinates: [number, number] }
      | undefined;
    if (coords) {
      return {
        position: [coords.coordinates[1], coords.coordinates[0]],
        label: `Abholung: ${order.restaurant.name}`,
      };
    }
  }
  if (
    (delivery.status === "PICKED_UP" || delivery.status === "IN_TRANSIT") &&
    order.deliveryAddress?.coordinates
  ) {
    const coords = order.deliveryAddress.coordinates as unknown as {
      coordinates: [number, number];
    };
    return {
      position: [coords.coordinates[1], coords.coordinates[0]],
      label: "Lieferadresse",
    };
  }
  return null;
}

function getStatusLabel(status: DeliveryEntity["status"]): string {
  switch (status) {
    case "ASSIGNED":
      return "Fahrt zur Abholung";
    case "PICKED_UP":
      return "Fahrt zum Kunden";
    case "IN_TRANSIT":
      return "Fahrt zum Kunden";
    case "DELIVERED":
      return "Zugestellt";
    default:
      return status;
  }
}

export function ActiveDeliveryView({
  delivery,
  order,
  onPickup,
  onDeliver,
  isActionLoading,
}: ActiveDeliveryViewProps) {
  const [currentPosition, setCurrentPosition] = useState<LatLng | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

  // GPS streaming: watch position and emit to socket
  useEffect(() => {
    if (delivery.status === "DELIVERED") return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCurrentPosition([lat, lng]);
        setGpsActive(true);

        const socket = getDeliverySocket();
        socket?.emit("driver:location", {
          orderId: order.$id,
          lat,
          lng,
          heading: position.coords.heading ?? 0,
          speed: position.coords.speed ?? 0,
        });
      },
      () => {
        setGpsActive(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [delivery.status, order.$id]);

  const dest = getDestination(delivery, order);

  return (
    <div className="flex flex-col h-full pb-20">
      {/* Status header */}
      <Card className="mx-4 mt-4 mb-2">
        <CardContent className="flex flex-row items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">
              {order.restaurant?.name ?? "Bestellung"}
            </h2>
            <span className="text-sm text-muted">
              {getStatusLabel(delivery.status)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Chip
              color={delivery.status === "DELIVERED" ? "success" : "primary"}
              variant="flat"
              size="sm"
            >
              {getStatusLabel(delivery.status)}
            </Chip>
            {gpsActive && delivery.status !== "DELIVERED" && (
              <span className="text-xs text-success flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
                GPS-Verbindung aktiv
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      {dest && (
        <div className="flex-1 mx-4 rounded-xl overflow-hidden">
          <NavigationMap
            currentPosition={currentPosition}
            destination={dest.position}
            destinationLabel={dest.label}
          />
        </div>
      )}

      {/* Action bar */}
      <DeliveryActionBar
        status={delivery.status}
        onPickup={onPickup}
        onDeliver={onDeliver}
        isLoading={isActionLoading}
      />
    </div>
  );
}

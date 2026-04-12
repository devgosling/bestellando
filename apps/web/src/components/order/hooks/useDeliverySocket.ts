import { useEffect } from "react";
import { getDeliverySocket } from "@repo/lib";
import type { DriverLocationEvent } from "@repo/interfaces";
import { useSocketEvent } from "../../../hooks/useSocketEvent";

interface UseDeliverySocketOptions {
  orderId: string;
  onGpsUpdate: (data: DriverLocationEvent) => void;
}

export function useDeliverySocket({
  orderId,
  onGpsUpdate,
}: UseDeliverySocketOptions) {
  const socket = getDeliverySocket();

  useEffect(() => {
    if (!socket) return;
    socket.emit("subscribe:delivery-tracking", { orderId });

    return () => {
      socket.emit("unsubscribe:delivery", { orderId });
    };
  }, [socket, orderId]);

  useSocketEvent<DriverLocationEvent>(
    socket,
    "delivery:gps-position",
    onGpsUpdate,
  );

  return socket;
}

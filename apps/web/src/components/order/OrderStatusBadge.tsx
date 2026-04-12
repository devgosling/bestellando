import { Chip } from "@heroui/react";
import type { OrderStatus } from "@repo/interfaces";

const statusColorMap: Record<OrderStatus, "warning" | "primary" | "secondary" | "success" | "danger"> = {
  PENDING: "warning",
  CONFIRMED: "primary",
  PREPARING: "secondary",
  READY: "success",
  PICKED_UP: "primary",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const statusLabelMap: Record<OrderStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestaetigt",
  PREPARING: "In Zubereitung",
  READY: "Bereit",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Zugestellt",
  CANCELLED: "Storniert",
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <Chip color={statusColorMap[status]} variant="flat" size="sm">
      {statusLabelMap[status]}
    </Chip>
  );
}

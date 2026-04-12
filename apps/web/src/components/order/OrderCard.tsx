import { Card, CardBody } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import type { OrderEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
import { OrderStatusBadge } from "./OrderStatusBadge";

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface OrderCardProps {
  order: OrderEntity;
}

export function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      isPressable
      onPress={() =>
        navigate({ to: "/orders/$orderId", params: { orderId: order.$id } })
      }
      className="w-full"
    >
      <CardBody className="flex flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">
            {order.restaurant?.name ?? "Restaurant"}
          </span>
          {order.createdAt && (
            <span className="text-xs text-default-500">
              {dateFormatter.format(new Date(order.createdAt))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <PriceDisplay
            amount={order.totalAmount}
            className="text-sm font-semibold"
          />
          <OrderStatusBadge status={order.currentStatus} />
        </div>
      </CardBody>
    </Card>
  );
}

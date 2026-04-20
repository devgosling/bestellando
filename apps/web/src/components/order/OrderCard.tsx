import { Card, CardContent } from "@heroui/react";
import { Link } from "@tanstack/react-router";
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
  return (
    <Link
      to="/orders/$orderId"
      params={{ orderId: order.$id }}
      className="block"
    >
      <Card className="w-full border border-border bg-surface transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
        <CardContent className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-semibold truncate">
              {typeof order.restaurant === "object" ? order.restaurant?.name : "Restaurant"}
            </span>
            {order.$createdAt && (
              <span className="text-xs text-muted">
                {dateFormatter.format(new Date(order.$createdAt))}
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
        </CardContent>
      </Card>
    </Link>
  );
}

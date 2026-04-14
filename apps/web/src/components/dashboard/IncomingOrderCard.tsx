import { Button, Card, CardContent, CardFooter, Separator } from "@heroui/react";
import type { OrderEntity, OrderStatus } from "@repo/interfaces";
import { OrderStatusBadge } from "../order/OrderStatusBadge";
import { PriceDisplay } from "../shared/PriceDisplay";

interface IncomingOrderCardProps {
  order: OrderEntity;
  onAccept?: (orderId: string) => void;
  onReject?: (orderId: string) => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => void;
}

const nextStatusMap: Partial<Record<OrderStatus, { label: string; status: OrderStatus }>> = {
  CONFIRMED: { label: "Zubereitung starten", status: "PREPARING" },
  PREPARING: { label: "Bereit zur Abholung", status: "READY" },
};

export function IncomingOrderCard({
  order,
  onAccept,
  onReject,
  onUpdateStatus,
}: IncomingOrderCardProps) {
  const isPending = order.currentStatus === "PENDING";
  const nextAction = nextStatusMap[order.currentStatus];

  const statusBorderColor =
    order.currentStatus === "PENDING"
      ? "border-l-warning"
      : order.currentStatus === "READY"
        ? "border-l-success"
        : "border-l-accent";

  return (
    <Card className={`w-full border-l-4 ${statusBorderColor}`}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted">
              Bestellung #{order.$id.slice(-6).toUpperCase()}
            </span>
            {order.createdAt && (
              <span className="text-xs text-muted">
                {new Date(order.createdAt).toLocaleString("de-DE")}
              </span>
            )}
          </div>
          <OrderStatusBadge status={order.currentStatus} />
        </div>

        <Separator />

        <div className="flex flex-col gap-1">
          <span className="text-sm text-muted">
            Kunde: {(typeof order.customer === "string" ? order.customer : order.customer.$id).slice(-6).toUpperCase()}
          </span>
          {order.specialInstructions && (
            <p className="text-sm italic text-muted">
              &quot;{order.specialInstructions}&quot;
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Gesamt</span>
          <PriceDisplay
            amount={order.totalAmount}
            className="text-lg font-bold"
          />
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 px-4 pb-4 pt-0">
        {isPending && (
          <>
            <Button
              color="danger"
              variant="flat"
              size="sm"
              className="flex-1"
              onPress={() => onReject?.(order.$id)}
            >
              Ablehnen
            </Button>
            <Button
              color="success"
              size="sm"
              className="flex-1"
              onPress={() => onAccept?.(order.$id)}
            >
              Akzeptieren
            </Button>
          </>
        )}
        {!isPending && nextAction && (
          <Button
            size="sm"
            className="flex-1 bg-accent text-accent-foreground font-semibold"
            onPress={() => onUpdateStatus?.(order.$id, nextAction.status)}
          >
            {nextAction.label}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

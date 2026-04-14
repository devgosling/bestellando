import { Button, Card, CardContent, CardHeader, Separator } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import { authenticatedFetch, getOrderSocket } from "@repo/lib";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  OrderEntity,
  OrderItemEntity,
  OrderStatusHistoryEntity,
} from "@repo/interfaces";
import { useSocketEvent } from "../../../hooks/useSocketEvent";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { PriceDisplay } from "../../../components/shared/PriceDisplay";
import { OrderStatusBadge } from "../../../components/order/OrderStatusBadge";
import { OrderTimeline } from "../../../components/order/OrderTimeline";
import { DeliveryMap } from "../../../components/order/DeliveryMap";

interface CheckoutSessionResponse {
  sessionUrl: string;
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "long",
  timeStyle: "short",
});

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const [isPayLoading, setIsPayLoading] = useState(false);
  const queryClient = useQueryClient();
  const orderSocket = getOrderSocket();

  // Subscribe to order room on mount
  useEffect(() => {
    if (orderSocket) {
      orderSocket.emit("subscribe:order", { orderId });
    }
  }, [orderSocket, orderId]);

  // Listen for status changes and invalidate queries
  useSocketEvent<{ orderId: string }>(
    orderSocket,
    "order:status-changed",
    (data) => {
      if (data.orderId === orderId) {
        queryClient.invalidateQueries({ queryKey: ["order", orderId] });
        queryClient.invalidateQueries({
          queryKey: ["order-history", orderId],
        });
      }
    },
  );

  const { data: order, isLoading: isLoadingOrder } =
    useApiQuery<OrderEntity>({
      request: { url: `/v1/order/${orderId}` },
      queryKey: ["order", orderId],
    });

  const { data: itemsData, isLoading: isLoadingItems } = useApiQuery<{
    data: OrderItemEntity[];
  }>({
    request: { url: `/v1/order/${orderId}/items` },
    queryKey: ["order-items", orderId],
  });

  const { data: historyData, isLoading: isLoadingHistory } = useApiQuery<{
    data: OrderStatusHistoryEntity[];
  }>({
    request: { url: `/v1/order/${orderId}/history` },
    queryKey: ["order-history", orderId],
  });

  const items = itemsData?.data ?? [];
  const history = historyData?.data ?? [];
  const isLoading = isLoadingOrder || isLoadingItems || isLoadingHistory;

  const handleRetryPayment = async () => {
    setIsPayLoading(true);
    try {
      const checkout = (await authenticatedFetch(
        `/v1/payment/checkout/${orderId}`,
        { method: "POST" },
      )) as CheckoutSessionResponse;
      window.location.href = checkout.sessionUrl;
    } catch {
      setIsPayLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
        <LoadingSkeleton count={3} type="row" />
      </AnimatedPage>
    );
  }

  if (!order) return null;

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">
            {order.restaurant?.name ?? "Bestellung"}
          </h1>
          {order.createdAt && (
            <p className="text-sm text-muted">
              {dateFormatter.format(new Date(order.createdAt))}
            </p>
          )}
        </div>
        <OrderStatusBadge status={order.currentStatus} />
      </div>

      {/* Order Items */}
      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-lg font-semibold">Artikel</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.$id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">
                  {item.quantity}x
                </span>
                <span className="text-sm">
                  {item.product?.name ?? "Produkt"}
                </span>
              </div>
              <PriceDisplay
                amount={item.totalPrice}
                className="text-sm font-medium"
              />
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted">Zwischensumme</span>
            <PriceDisplay amount={order.subtotal} className="font-medium" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Liefergebühr</span>
            <PriceDisplay amount={order.deliveryFee} className="font-medium" />
          </div>

          <Separator />

          <div className="flex justify-between text-base font-semibold">
            <span>Gesamt</span>
            <PriceDisplay amount={order.totalAmount} />
          </div>
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card className="mb-4">
        <CardHeader>
          <h2 className="text-lg font-semibold">Statusverlauf</h2>
        </CardHeader>
        <CardContent>
          <OrderTimeline
            history={history.map((h) => ({
              status: h.status,
              changedAt: h.changedAt,
              changedBy: h.changedBy,
            }))}
            currentStatus={order.currentStatus}
          />
        </CardContent>
      </Card>

      {/* Live delivery tracking map */}
      {order.deliveryPersonId &&
        (order.currentStatus === "PICKED_UP" ||
          order.currentStatus === "DELIVERED") &&
        order.restaurant?.address?.coordinates &&
        order.deliveryAddress?.coordinates && (
          <Card className="mb-4">
            <CardHeader>
              <h2 className="text-lg font-semibold">Live-Tracking</h2>
            </CardHeader>
            <CardContent>
              <DeliveryMap
                orderId={orderId}
                restaurantPosition={[
                  order.restaurant.address.coordinates.coordinates[1],
                  order.restaurant.address.coordinates.coordinates[0],
                ]}
                customerPosition={[
                  order.deliveryAddress.coordinates.coordinates[1],
                  order.deliveryAddress.coordinates.coordinates[0],
                ]}
                restaurantName={order.restaurant.name}
              />
            </CardContent>
          </Card>
        )}

      {/* Retry payment for PENDING orders */}
      {order.currentStatus === "PENDING" &&
        order.paymentStatus !== "PAID" && (
          <Button
            size="lg"
            className="w-full bg-accent text-accent-foreground font-semibold"
            isLoading={isPayLoading}
            onPress={handleRetryPayment}
          >
            Bezahlen
          </Button>
        )}
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-customer)/orders/$orderId",
)({
  component: OrderDetailPage,
  staticData: { showHeader: true, showFooter: true },
});

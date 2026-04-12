import { useState } from "react";
import { Button } from "@heroui/react";
import { ShoppingCart } from "@gravity-ui/icons";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import type { OrderEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { EmptyState } from "../../../components/shared/EmptyState";
import { OrderCard } from "../../../components/order/OrderCard";

interface OrdersResponse {
  data: OrderEntity[];
  total: number;
}

function OrdersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 25;

  const { data: ordersData, isLoading } = useApiQuery<OrdersResponse>({
    request: { url: `/v1/order/mine?page=${page}&limit=${limit}` },
    queryKey: ["orders", page],
  });

  const orders = ordersData?.data ?? [];
  const total = ordersData?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meine Bestellungen</h1>

      {isLoading ? (
        <LoadingSkeleton count={4} type="row" />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Keine Bestellungen"
          description="Du hast noch keine Bestellungen aufgegeben."
          icon={<ShoppingCart className="size-12" />}
          action={
            <Button
              color="primary"
              onPress={() => navigate({ to: "/restaurants" })}
            >
              Jetzt bestellen
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.$id} order={order} />
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="flat"
                isDisabled={page <= 1}
                onPress={() => setPage((p) => p - 1)}
              >
                Zurueck
              </Button>
              <span className="flex items-center text-sm text-default-500">
                Seite {page} von {totalPages}
              </span>
              <Button
                size="sm"
                variant="flat"
                isDisabled={page >= totalPages}
                onPress={() => setPage((p) => p + 1)}
              >
                Weiter
              </Button>
            </div>
          )}
        </div>
      )}
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-customer)/orders/")({
  component: OrdersPage,
  staticData: { showHeader: true, showFooter: true },
});

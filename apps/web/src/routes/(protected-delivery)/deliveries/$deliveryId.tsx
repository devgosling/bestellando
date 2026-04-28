import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import { authenticatedFetch } from "@repo/lib";
import { useState } from "react";
import type { DeliveryEntity, OrderEntity } from "@repo/interfaces";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { ActiveDeliveryView } from "../../../components/delivery/ActiveDeliveryView";

function DeliveryDetailPage() {
  const { deliveryId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data: delivery, isLoading: isDeliveryLoading } =
    useApiQuery<DeliveryEntity>({
      request: { url: `/v1/delivery/${deliveryId}` },
      queryKey: ["delivery", deliveryId],
      refetchInterval: 10000,
    });

  const orderId = delivery?.order;

  const { data: order, isLoading: isOrderLoading } = useApiQuery<OrderEntity>({
    request: { url: `/v1/order/${orderId}` },
    queryKey: ["order", orderId],
    enabled: !!orderId,
  });

  const handlePickup = async () => {
    setIsActionLoading(true);
    try {
      await authenticatedFetch(`/v1/delivery/${deliveryId}/pickup`, {
        method: "PATCH",
      });
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
    } finally {
      setIsActionLoading(false);
    }
  };

  const pickProofImage = (): Promise<File | null> =>
    new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.oncancel = () => resolve(null);
      input.click();
    });

  const handleDeliver = async () => {
    const file = await pickProofImage();
    if (!file) return;
    setIsActionLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploaded = (await authenticatedFetch(
        `/v1/delivery/${deliveryId}/proof`,
        { method: "POST", body: form },
      )) as { fileId: string };
      await authenticatedFetch(`/v1/delivery/${deliveryId}/delivered`, {
        method: "PATCH",
        body: JSON.stringify({ proofImageId: uploaded.fileId }),
      });
      queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
    } finally {
      setIsActionLoading(false);
    }
  };

  const isLoading = isDeliveryLoading || isOrderLoading;

  if (isLoading) {
    return (
      <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
        <LoadingSkeleton count={3} type="row" />
      </AnimatedPage>
    );
  }

  if (!delivery || !order) return null;

  return (
    <AnimatedPage className="h-full">
      <ActiveDeliveryView
        delivery={delivery}
        order={order}
        onPickup={handlePickup}
        onDeliver={handleDeliver}
        isActionLoading={isActionLoading}
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-delivery)/deliveries/$deliveryId",
)({
  component: DeliveryDetailPage,
  staticData: { showHeader: true, showFooter: false },
});

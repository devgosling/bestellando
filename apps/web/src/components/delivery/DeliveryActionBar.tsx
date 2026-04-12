import { Button } from "@heroui/react";
import type { DeliveryStatus } from "@repo/interfaces";

interface DeliveryActionBarProps {
  status: DeliveryStatus;
  onPickup: () => void;
  onDeliver: () => void;
  isLoading?: boolean;
}

export function DeliveryActionBar({
  status,
  onPickup,
  onDeliver,
  isLoading,
}: DeliveryActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-divider p-4 z-50">
      <div className="mx-auto max-w-2xl">
        {status === "ASSIGNED" && (
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={onPickup}
            isLoading={isLoading}
          >
            <i className="fa-regular fa-box" />
            Abgeholt
          </Button>
        )}
        {status === "PICKED_UP" && (
          <Button
            color="success"
            size="lg"
            className="w-full"
            onPress={onDeliver}
            isLoading={isLoading}
          >
            <i className="fa-regular fa-check" />
            Zugestellt
          </Button>
        )}
        {status === "DELIVERED" && (
          <div className="text-center text-success font-semibold py-2">
            <i className="fa-regular fa-circle-check mr-2" />
            Lieferung abgeschlossen
          </div>
        )}
      </div>
    </div>
  );
}

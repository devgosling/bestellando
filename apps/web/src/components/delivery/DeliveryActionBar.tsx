import { Button } from "@heroui/react";
import { Archive, CircleCheck } from "@gravity-ui/icons";
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
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-4 z-50">
      <div className="mx-auto max-w-2xl">
        {status === "ASSIGNED" && (
          <Button
            size="lg"
            className="w-full bg-accent text-accent-foreground font-semibold"
            onPress={onPickup}
            isLoading={isLoading}
          >
            <Archive className="size-5" />
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
            <CircleCheck className="size-5" />
            Zugestellt
          </Button>
        )}
        {status === "DELIVERED" && (
          <div className="text-center text-success font-semibold py-2">
            <CircleCheck className="size-5 mr-2" />
            Lieferung abgeschlossen
          </div>
        )}
      </div>
    </div>
  );
}

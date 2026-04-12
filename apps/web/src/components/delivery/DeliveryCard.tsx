import { Button, Card, CardContent, CardFooter, Separator } from "@heroui/react";
import { GeoPin } from "@gravity-ui/icons";
import type { AddressEntity } from "@repo/interfaces";

interface DeliveryCardProps {
  orderId: string;
  restaurantName: string;
  pickupAddress: AddressEntity;
  deliveryAddress: AddressEntity;
  onAccept: (orderId: string) => void;
  isAccepting?: boolean;
}

function formatAddress(address: AddressEntity): string {
  return `${address.street} ${address.streetNumber}, ${address.zipCode} ${address.city}`;
}

export function DeliveryCard({
  orderId,
  restaurantName,
  pickupAddress,
  deliveryAddress,
  onAccept,
  isAccepting,
}: DeliveryCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">{restaurantName}</h3>
        <Separator />
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <GeoPin className="size-4 text-accent mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted">Abholung</span>
              <span className="text-sm">{formatAddress(pickupAddress)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GeoPin className="size-4 text-danger mt-0.5 shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs text-muted">Lieferung</span>
              <span className="text-sm">{formatAddress(deliveryAddress)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-accent text-accent-foreground font-semibold"
          onPress={() => onAccept(orderId)}
          isLoading={isAccepting}
        >
          Lieferung annehmen
        </Button>
      </CardFooter>
    </Card>
  );
}

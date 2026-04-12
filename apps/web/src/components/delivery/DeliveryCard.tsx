import { Button, Card, CardBody, CardFooter, Divider } from "@heroui/react";
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
      <CardBody className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">{restaurantName}</h3>
        <Divider />
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <i className="fa-regular fa-store text-primary mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs text-default-400">Abholung</span>
              <span className="text-sm">{formatAddress(pickupAddress)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-regular fa-location-dot text-danger mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs text-default-400">Lieferung</span>
              <span className="text-sm">{formatAddress(deliveryAddress)}</span>
            </div>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <Button
          color="primary"
          className="w-full"
          onPress={() => onAccept(orderId)}
          isLoading={isAccepting}
        >
          Lieferung annehmen
        </Button>
      </CardFooter>
    </Card>
  );
}

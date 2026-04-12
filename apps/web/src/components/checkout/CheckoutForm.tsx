import { useState } from "react";
import { Button, Card, CardBody, CardHeader, Divider } from "@heroui/react";
import { authenticatedFetch } from "@repo/lib";
import { useCartStore } from "../../stores/cart-store";
import { PriceDisplay } from "../shared/PriceDisplay";
import { AddressSelector } from "./AddressSelector";

interface CreateOrderResponse {
  $id: string;
}

interface CheckoutSessionResponse {
  sessionUrl: string;
}

export function CheckoutForm() {
  const items = useCartStore((s) => s.items);
  const restaurantId = useCartStore((s) => s.restaurantId);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const clearCart = useCartStore((s) => s.clearCart);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!selectedAddressId || !restaurantId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const orderPayload = {
        restaurantId,
        deliveryAddressId: selectedAddressId,
        items: items.map((item) => ({
          productId: item.product.$id,
          quantity: item.quantity,
        })),
      };

      const order = (await authenticatedFetch("/v1/order", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      })) as CreateOrderResponse;

      const checkout = (await authenticatedFetch(
        `/v1/payment/checkout/${order.$id}`,
        { method: "POST" },
      )) as CheckoutSessionResponse;

      clearCart();
      window.location.href = checkout.sessionUrl;
    } catch {
      setError(
        "Bestellung konnte nicht erstellt werden. Bitte versuche es erneut.",
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Lieferadresse</h2>
        </CardHeader>
        <CardBody>
          <AddressSelector
            selectedId={selectedAddressId}
            onChange={setSelectedAddressId}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Bestelluebersicht
            {restaurantName && (
              <span className="ml-2 text-sm font-normal text-default-500">
                {restaurantName}
              </span>
            )}
          </h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.product.$id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-500">
                  {item.quantity}x
                </span>
                <span className="text-sm">{item.product.name}</span>
              </div>
              <PriceDisplay
                amount={item.product.basePrice * item.quantity}
                className="text-sm font-medium"
              />
            </div>
          ))}

          <Divider />

          <div className="flex justify-between text-sm">
            <span className="text-default-500">Zwischensumme</span>
            <PriceDisplay amount={subtotal} className="font-medium" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-default-500">Liefergebuehr</span>
            <span className="text-xs text-default-400">wird berechnet</span>
          </div>

          <Divider />

          <div className="flex justify-between text-base font-semibold">
            <span>Gesamt</span>
            <PriceDisplay amount={subtotal} />
          </div>
        </CardBody>
      </Card>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <Button
        color="primary"
        size="lg"
        className="w-full"
        isLoading={isSubmitting}
        isDisabled={!selectedAddressId}
        onPress={handleCheckout}
      >
        Bezahlen
      </Button>
    </div>
  );
}

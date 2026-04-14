import { useState } from "react";
import { Button, Card, CardContent, CardHeader, Separator } from "@heroui/react";
import { authenticatedFetch } from "@repo/lib";
import { lineUnitPrice, useCartStore } from "../../stores/cart-store";
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
          modifierOptionIds: item.modifiers.map((m) => m.$id),
          specialInstructions: item.specialInstructions,
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
        <CardContent>
          <AddressSelector
            selectedId={selectedAddressId}
            onChange={setSelectedAddressId}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Bestellübersicht
            {restaurantName && (
              <span className="ml-2 text-sm font-normal text-muted">
                {restaurantName}
              </span>
            )}
          </h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted">{item.quantity}x</span>
                  <span className="text-sm">{item.product.name}</span>
                </div>
                {item.modifiers.length > 0 && (
                  <span className="text-xs text-muted">
                    {item.modifiers.map((m) => m.name).join(", ")}
                  </span>
                )}
              </div>
              <PriceDisplay
                amount={lineUnitPrice(item) * item.quantity}
                className="text-sm font-medium"
              />
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted">Zwischensumme</span>
            <PriceDisplay amount={subtotal} className="font-medium" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Liefergebühr</span>
            <span className="text-xs text-muted">wird berechnet</span>
          </div>

          <Separator />

          <div className="flex justify-between text-base font-semibold">
            <span>Gesamt</span>
            <PriceDisplay amount={subtotal} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <Button
        size="lg"
        className="w-full bg-accent text-accent-foreground font-semibold"
        isLoading={isSubmitting}
        isDisabled={!selectedAddressId}
        onPress={handleCheckout}
      >
        Bezahlen
      </Button>
    </div>
  );
}

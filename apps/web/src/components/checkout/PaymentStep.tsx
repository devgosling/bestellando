import { useEffect, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft } from "@gravity-ui/icons";
import { authenticatedFetch } from "@repo/lib";
import { useCartStore } from "../../stores/cart-store";

interface PaymentStepProps {
  selectedAddressId: string;
  notes?: string;
  onBack: () => void;
  onSuccess: (orderId: string) => void;
  onError: (message: string) => void;
}

interface CreateOrderResponse {
  $id: string;
}

interface CheckoutSessionResponse {
  sessionUrl: string;
}

export function PaymentStep({
  selectedAddressId,
  notes,
  onBack,
  onSuccess,
  onError,
}: PaymentStepProps) {
  const clearCart = useCartStore((s) => s.clearCart);

  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processCheckout = async () => {
    // Wait for zustand persist hydration
    if (!useCartStore.persist.hasHydrated()) {
      await new Promise<void>((resolve) => {
        const unsub = useCartStore.persist.onFinishHydration(() => {
          unsub();
          resolve();
        });
      });
    }
    const { items, restaurantId: storeRestaurantId } = useCartStore.getState();
    // Fallback: derive restaurantId from cart items if store value is missing
    let restaurantId = storeRestaurantId;
    if (!restaurantId && items.length > 0) {
      const rel = items[0].product.restaurant;
      restaurantId = typeof rel === "string" ? rel : (rel as any)?.$id ?? null;
    }
    if (!restaurantId || items.length === 0) {
      const message = "Warenkorb ist leer oder Restaurant nicht erkannt.";
      setError(message);
      setIsProcessing(false);
      onError(message);
      return;
    }

    setIsProcessing(true);
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
        ...(notes ? { notes } : {}),
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
      const message =
        "Bestellung konnte nicht erstellt werden. Bitte versuche es erneut.";
      setError(message);
      setIsProcessing(false);
      onError(message);
    }
  };

  useEffect(() => {
    processCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <p className="text-sm text-danger">{error}</p>
        <div className="flex gap-3">
          <Button variant="flat" size="lg" onPress={onBack} startContent={<ArrowLeft className="size-4" />}>
            Zurück
          </Button>
          <Button
            size="lg"
            className="bg-accent text-accent-foreground font-semibold"
            onPress={processCheckout}
          >
            Erneut versuchen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <Spinner size="lg" />
      <p className="text-muted text-sm">Weiterleitung zu Stripe...</p>
    </div>
  );
}

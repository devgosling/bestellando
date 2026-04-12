import { Button, Divider } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { PriceDisplay } from "../shared/PriceDisplay";
import { useCartStore } from "../../stores/cart-store";

export function CartSummary() {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Divider />
      <div className="flex justify-between text-sm">
        <span className="text-default-500">Zwischensumme</span>
        <PriceDisplay amount={subtotal} className="font-medium" />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-default-500">Liefergebuehr</span>
        <span className="text-default-400 text-xs">wird berechnet</span>
      </div>
      <Divider />
      <div className="flex justify-between text-base font-semibold">
        <span>Gesamt</span>
        <PriceDisplay amount={subtotal} />
      </div>
      <Button
        color="primary"
        size="lg"
        className="w-full mt-2"
        onPress={() => navigate({ to: "/checkout" })}
      >
        Zur Kasse
      </Button>
    </div>
  );
}

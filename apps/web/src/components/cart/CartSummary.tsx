import { Button, Separator } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { PriceDisplay } from "../shared/PriceDisplay";
import { useCartStore } from "../../stores/cart-store";

export function CartSummary() {
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-3 pt-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted">Zwischensumme</span>
        <PriceDisplay amount={subtotal} className="font-medium" />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted">Liefergebühr</span>
        <span className="text-muted text-xs">wird berechnet</span>
      </div>
      <Separator />
      <div className="flex justify-between text-base font-bold text-foreground">
        <span>Gesamt</span>
        <PriceDisplay amount={subtotal} />
      </div>
      <Button
        size="lg"
        className="w-full mt-2 bg-accent text-accent-foreground font-semibold"
        onPress={() => navigate({ to: "/checkout" })}
      >
        Zur Kasse
      </Button>
    </div>
  );
}

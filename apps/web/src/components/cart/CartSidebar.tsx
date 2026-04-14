import { Button, Separator } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCartStore } from "../../stores/cart-store";
import { CartItem } from "./CartItem";
import { CartEmpty } from "./CartEmpty";
import { PriceDisplay } from "../shared/PriceDisplay";

export function CartSidebar({ deliveryFee = 2.5 }: { deliveryFee?: number }) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground mb-3">
          Warenkorb
        </h3>
        <CartEmpty />
      </div>
    );
  }

  const total = subtotal + deliveryFee;

  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-base font-bold text-foreground mb-3">
        Warenkorb
      </h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>
      <Separator className="my-3" />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted">
          <span>Zwischensumme</span>
          <PriceDisplay amount={subtotal} />
        </div>
        <div className="flex justify-between text-muted">
          <span>Liefergebühr</span>
          <PriceDisplay amount={deliveryFee} />
        </div>
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t-2 border-foreground">
          <span>Gesamt</span>
          <PriceDisplay amount={total} />
        </div>
      </div>
      <Button
        className="mt-3 w-full bg-accent text-accent-foreground font-semibold"
        onPress={() => navigate({ to: "/checkout" })}
      >
        Zur Kasse
      </Button>
    </div>
  );
}

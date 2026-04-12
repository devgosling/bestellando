import { Button } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { PriceDisplay } from "../shared/PriceDisplay";
import { useCartStore, type CartItem as CartItemType } from "../../stores/cart-store";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const lineTotal = item.product.basePrice * item.quantity;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-divider last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {item.product.name}
        </p>
        {item.specialInstructions && (
          <p className="text-xs text-default-400 mt-0.5 italic truncate">
            {item.specialInstructions}
          </p>
        )}
        <div className="mt-1.5">
          <PriceDisplay amount={lineTotal} className="text-sm font-semibold text-primary" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          aria-label="Menge verringern"
          onPress={() => updateQuantity(item.product.$id, item.quantity - 1)}
        >
          -
        </Button>
        <span className="min-w-[1.5rem] text-center text-sm font-semibold">
          {item.quantity}
        </span>
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          aria-label="Menge erhoehen"
          onPress={() => updateQuantity(item.product.$id, item.quantity + 1)}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="light"
          isIconOnly
          color="danger"
          aria-label="Entfernen"
          onPress={() => removeItem(item.product.$id)}
        >
          <TrashBin className="size-4" />
        </Button>
      </div>
    </div>
  );
}

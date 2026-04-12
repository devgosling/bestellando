import { Button } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { PriceDisplay } from "../shared/PriceDisplay";
import {
  useCartStore,
  type CartItem as CartItemType,
} from "../../stores/cart-store";

interface CartItemProps {
  item: CartItemType;
  compact?: boolean;
}

export function CartItem({ item, compact = false }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const lineTotal = item.product.basePrice * item.quantity;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <span className="bg-accent/10 text-accent font-bold text-xs px-2 py-0.5 rounded shrink-0">
        {item.quantity}x
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{item.product.name}</p>
        {item.specialInstructions && (
          <p className="text-xs text-muted mt-0.5 italic truncate">
            {item.specialInstructions}
          </p>
        )}
      </div>

      <PriceDisplay
        amount={lineTotal}
        className="text-sm font-semibold text-accent shrink-0"
      />

      {!compact && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Menge verringern"
            onPress={() =>
              updateQuantity(item.product.$id, item.quantity - 1)
            }
          >
            -
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            aria-label="Menge erhoehen"
            onPress={() =>
              updateQuantity(item.product.$id, item.quantity + 1)
            }
          >
            +
          </Button>
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            color="danger"
            aria-label="Entfernen"
            onPress={() => removeItem(item.product.$id)}
          >
            <TrashBin className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

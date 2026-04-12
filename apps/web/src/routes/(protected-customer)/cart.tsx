import { useState } from "react";
import { Button } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatedPage } from "../../components/shared/AnimatedPage";
import { ConfirmDialog } from "../../components/shared/ConfirmDialog";
import { CartItem } from "../../components/cart/CartItem";
import { CartSummary } from "../../components/cart/CartSummary";
import { CartEmpty } from "../../components/cart/CartEmpty";
import { useCartStore } from "../../stores/cart-store";

function CartPage() {
  const items = useCartStore((s) => s.items);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const clearCart = useCartStore((s) => s.clearCart);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasItems = items.length > 0;

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Warenkorb</h1>
          {restaurantName && (
            <p className="text-sm text-default-500 mt-1">{restaurantName}</p>
          )}
        </div>
        {hasItems && (
          <Button
            variant="flat"
            color="danger"
            size="sm"
            startContent={<TrashBin className="size-4" />}
            onPress={() => setConfirmOpen(true)}
          >
            Warenkorb leeren
          </Button>
        )}
      </div>

      {hasItems ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-divider bg-content1 px-4">
            {items.map((item) => (
              <CartItem key={item.product.$id} item={item} />
            ))}
          </div>
          <CartSummary />
        </div>
      ) : (
        <CartEmpty />
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={clearCart}
        title="Warenkorb leeren"
        description="Moechtest du wirklich alle Artikel aus deinem Warenkorb entfernen?"
        confirmLabel="Leeren"
        variant="danger"
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-customer)/cart")({
  component: CartPage,
  staticData: { showHeader: true, showFooter: true },
});

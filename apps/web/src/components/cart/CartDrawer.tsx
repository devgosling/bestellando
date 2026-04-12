import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@heroui/react";
import { Xmark } from "@gravity-ui/icons";
import { useCartStore } from "../../stores/cart-store";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartEmpty } from "./CartEmpty";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const hasItems = items.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Warenkorb
                </h2>
                {restaurantName && (
                  <p className="text-xs text-muted">{restaurantName}</p>
                )}
              </div>
              <Button
                isIconOnly
                variant="ghost"
                aria-label="Warenkorb schliessen"
                onPress={onClose}
              >
                <Xmark className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4">
              {hasItems ? (
                items.map((item) => (
                  <CartItem key={item.product.$id} item={item} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <CartEmpty />
                </div>
              )}
            </div>

            {hasItems && (
              <div className="border-t border-border px-4 pb-4">
                <CartSummary />
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

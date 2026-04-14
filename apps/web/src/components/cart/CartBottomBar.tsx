import { Badge, BadgeAnchor, Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingCart } from "@gravity-ui/icons";
import { useCartStore } from "../../stores/cart-store";
import { PriceDisplay } from "../shared/PriceDisplay";
import { motion, AnimatePresence } from "framer-motion";

export function CartBottomBar() {
  const totalItems = useCartStore((s) => s.getTotalItems());
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-14 left-0 right-0 z-40 lg:hidden px-3 pb-2"
        >
          <div className="flex items-center justify-between bg-accent text-accent-foreground rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <BadgeAnchor>
                <ShoppingCart className="size-5" />
                <Badge size="sm" color="default" placement="top-right">
                  {totalItems}
                </Badge>
              </BadgeAnchor>
              <span className="font-semibold text-sm">
                <PriceDisplay amount={subtotal} />
              </span>
            </div>
            <Button
              size="sm"
              variant="solid"
              className="bg-white text-accent font-bold"
              onPress={() => navigate({ to: "/checkout" })}
            >
              Zur Kasse
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

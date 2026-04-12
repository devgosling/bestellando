import {
  Modal,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextArea,
} from "@heroui/react";
import { useState } from "react";
import type { ProductEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { useCartStore } from "../../stores/cart-store";

interface ProductModalProps {
  product: ProductEntity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [instructions, setInstructions] = useState("");
  const addItem = useCartStore((state) => state.addItem);
  const pendingItem = useCartStore((state) => state.pendingItem);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const confirmPendingItem = useCartStore((state) => state.confirmPendingItem);
  const cancelPendingItem = useCartStore((state) => state.cancelPendingItem);

  const handleClose = () => {
    setQuantity(1);
    setInstructions("");
    onClose();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, instructions || undefined);
    // Only close if no pending item was set (i.e., no restaurant switch)
    if (
      !useCartStore.getState().pendingItem
    ) {
      handleClose();
    }
  };

  if (!product) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalDialog>
          <ModalHeader className="flex flex-col gap-1">
            {product.name}
          </ModalHeader>
          <ModalBody>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-48 w-full rounded-lg object-cover"
              />
            )}
            {product.description && (
              <p className="text-sm text-muted">{product.description}</p>
            )}
            <div className="text-lg font-semibold">
              <PriceDisplay amount={product.basePrice} />
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Menge:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  isDisabled={quantity <= 1}
                >
                  -
                </Button>
                <span className="min-w-[2rem] text-center font-semibold">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="flat"
                  isIconOnly
                  onPress={() => setQuantity((q) => q + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <TextArea
              label="Sonderhinweise"
              placeholder="z.B. ohne Zwiebeln, extra scharf..."
              value={instructions}
              onValueChange={setInstructions}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              Abbrechen
            </Button>
            <Button
              className="bg-accent text-accent-foreground"
              onPress={handleAddToCart}
            >
              In den Warenkorb ({quantity}x{" "}
              <PriceDisplay amount={product.basePrice * quantity} />)
            </Button>
          </ModalFooter>
        </ModalDialog>
      </Modal>

      <ConfirmDialog
        isOpen={pendingItem !== null}
        onClose={cancelPendingItem}
        onConfirm={() => {
          confirmPendingItem();
          handleClose();
        }}
        title="Restaurant wechseln?"
        description={`Du hast bereits Artikel von ${restaurantName} im Warenkorb. Warenkorb leeren und bei ${pendingItem?.product.restaurant.name} bestellen?`}
        confirmLabel="Leeren & hinzufügen"
        cancelLabel="Abbrechen"
        variant="danger"
      />
    </>
  );
}

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from "@heroui/react";
import { useState } from "react";
import type { ProductEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
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

  const handleClose = () => {
    setQuantity(1);
    setInstructions("");
    onClose();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, instructions || undefined);
    handleClose();
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalContent>
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
            <p className="text-sm text-default-500">{product.description}</p>
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

          <Textarea
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
          <Button color="primary" onPress={handleAddToCart}>
            In den Warenkorb ({quantity}x{" "}
            <PriceDisplay amount={product.basePrice * quantity} />)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

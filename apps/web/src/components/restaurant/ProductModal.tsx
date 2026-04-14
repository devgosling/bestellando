import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  Label,
  TextArea,
  TextField,
} from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import type {
  ModifierOptionEntity,
  ProductEntity,
} from "@repo/interfaces";
import { MODIFIER_TYPE_LABELS, type ModifierType } from "@repo/interfaces";
import { useApiQuery } from "@repo/hooks";
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const addItem = useCartStore((state) => state.addItem);
  const pendingItem = useCartStore((state) => state.pendingItem);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const confirmPendingItem = useCartStore((state) => state.confirmPendingItem);
  const cancelPendingItem = useCartStore((state) => state.cancelPendingItem);

  const { data: modifierData } = useApiQuery<{
    data: ModifierOptionEntity[];
    total: number;
  }>({
    request: { url: `/v1/modifier-option?productId=${product?.$id}` },
    queryKey: ["modifier-option", product?.$id],
    enabled: !!product?.$id && isOpen,
  });

  const modifiers = modifierData?.data ?? [];

  useEffect(() => {
    if (!product) return;
    const defaults = (modifierData?.data ?? [])
      .filter((m) => m.isDefault && m.isAvailable !== false)
      .map((m) => m.$id);
    setSelectedIds(defaults);
  }, [product, modifierData]);

  const groupedModifiers = useMemo(() => {
    const groups = new Map<ModifierType | "UNCATEGORIZED", ModifierOptionEntity[]>();
    for (const m of modifiers) {
      const types = (m.type ?? []) as ModifierType[];
      const buckets = types.length
        ? types
        : (["UNCATEGORIZED" as const] as (ModifierType | "UNCATEGORIZED")[]);
      for (const bucket of buckets) {
        const list = groups.get(bucket) ?? [];
        list.push(m);
        groups.set(bucket, list);
      }
    }
    return Array.from(groups.entries());
  }, [modifiers]);

  const selectedOptions = modifiers.filter((m) => selectedIds.includes(m.$id));
  const modifierTotal = selectedOptions.reduce(
    (sum, m) => sum + (m.priceDelta || 0),
    0,
  );
  const unitPrice = (product?.basePrice ?? 0) + modifierTotal;

  const toggleModifier = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleClose = () => {
    setQuantity(1);
    setInstructions("");
    setSelectedIds([]);
    onClose();
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      product,
      quantity,
      instructions || undefined,
      selectedOptions.map((m) => ({
        $id: m.$id,
        name: m.name,
        priceDelta: m.priceDelta,
      })),
    );
    if (!useCartStore.getState().pendingItem) {
      handleClose();
    }
  };

  if (!product) return null;

  return (
    <>
      <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <ModalBackdrop>
        <ModalContainer size="lg">
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

            {groupedModifiers.length > 0 && (
              <div className="flex flex-col gap-3">
                {groupedModifiers.map(([bucket, options]) => (
                  <div key={String(bucket)} className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">
                      {bucket === "UNCATEGORIZED"
                        ? "Extras"
                        : MODIFIER_TYPE_LABELS[bucket as ModifierType]}
                    </span>
                    <div className="flex flex-col gap-1.5 rounded-lg border border-border p-3">
                      {options.map((m) => (
                        <Checkbox
                          key={m.$id}
                          isSelected={selectedIds.includes(m.$id)}
                          isDisabled={m.isAvailable === false}
                          onChange={() => toggleModifier(m.$id)}
                        >
                          <span className="flex w-full items-center justify-between gap-3">
                            <span>{m.name}</span>
                            {m.priceDelta !== 0 && (
                              <span className="text-sm text-muted">
                                {m.priceDelta > 0 ? "+" : ""}
                                <PriceDisplay amount={m.priceDelta} />
                              </span>
                            )}
                          </span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                <span className="min-w-8 text-center font-semibold">
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

            <TextField
              value={instructions}
              onChange={setInstructions}
            >
              <Label>Sonderhinweise</Label>
              <TextArea placeholder="z.B. ohne Zwiebeln, extra scharf..." />
            </TextField>
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
              <PriceDisplay amount={unitPrice * quantity} />)
            </Button>
          </ModalFooter>
        </ModalDialog>
        </ModalContainer>
        </ModalBackdrop>
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

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  Switch,
  TextArea,
} from "@heroui/react";
import type { ProductEntity } from "@repo/interfaces";
import { useState, useEffect } from "react";

interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  prepTimeMinutes: number;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
  product?: ProductEntity;
  isLoading?: boolean;
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  basePrice: 0,
  prepTimeMinutes: 15,
  imageUrl: "",
  isAvailable: true,
  isFeatured: false,
};

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading,
}: ProductFormModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description,
        basePrice: product.basePrice,
        prepTimeMinutes: product.prepTimeMinutes,
        imageUrl: product.imageUrl ?? "",
        isAvailable: product.isAvailable,
        isFeatured: product.isFeatured,
      });
    } else {
      setForm(emptyForm);
    }
  }, [product, isOpen]);

  const isEditing = !!product;

  const handleSubmit = () => {
    onSubmit(form);
  };

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalDialog>
        <ModalHeader>
          {isEditing ? "Produkt bearbeiten" : "Neues Produkt"}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onValueChange={(v) => updateField("name", v)}
            isRequired
          />
          <TextArea
            label="Beschreibung"
            value={form.description}
            onValueChange={(v) => updateField("description", v)}
            minRows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preis (EUR)"
              type="number"
              value={String(form.basePrice)}
              onValueChange={(v) => updateField("basePrice", parseFloat(v) || 0)}
              isRequired
              min={0}
              step={0.01}
            />
            <Input
              label="Zubereitungszeit (Min.)"
              type="number"
              value={String(form.prepTimeMinutes)}
              onValueChange={(v) =>
                updateField("prepTimeMinutes", parseInt(v) || 0)
              }
              min={0}
            />
          </div>
          <Input
            label="Bild-URL"
            value={form.imageUrl}
            onValueChange={(v) => updateField("imageUrl", v)}
            placeholder="https://..."
          />
          <div className="flex flex-col gap-3">
            <Switch
              isSelected={form.isAvailable}
              onValueChange={(v) => updateField("isAvailable", v)}
            >
              Verfuegbar
            </Switch>
            <Switch
              isSelected={form.isFeatured}
              onValueChange={(v) => updateField("isFeatured", v)}
            >
              Empfohlen
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Abbrechen
          </Button>
          <Button
            className="bg-accent text-accent-foreground font-semibold"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!form.name.trim()}
          >
            Speichern
          </Button>
        </ModalFooter>
      </ModalDialog>
    </Modal>
  );
}

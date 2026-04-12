import {
  Button,
  Input,
  Label,
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContainer,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  Switch,
  TextArea,
  TextField,
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
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalBackdrop>
      <ModalContainer size="lg" scroll="inside">
      <ModalDialog>
        <ModalHeader>
          {isEditing ? "Produkt bearbeiten" : "Neues Produkt"}
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          <TextField
            value={form.name}
            onChange={(v) => updateField("name", v)}
            isRequired
          >
            <Label>Name</Label>
            <Input />
          </TextField>
          <TextField
            value={form.description}
            onChange={(v) => updateField("description", v)}
          >
            <Label>Beschreibung</Label>
            <TextArea rows={2} />
          </TextField>
          <div className="grid grid-cols-2 gap-4">
            <TextField
              value={String(form.basePrice)}
              onChange={(v) => updateField("basePrice", Number.parseFloat(v) || 0)}
              isRequired
            >
              <Label>Preis (EUR)</Label>
              <Input type="number" min={0} step={0.01} />
            </TextField>
            <TextField
              value={String(form.prepTimeMinutes)}
              onChange={(v) =>
                updateField("prepTimeMinutes", Number.parseInt(v) || 0)
              }
            >
              <Label>Zubereitungszeit (Min.)</Label>
              <Input type="number" min={0} />
            </TextField>
          </div>
          <TextField
            value={form.imageUrl}
            onChange={(v) => updateField("imageUrl", v)}
          >
            <Label>Bild-URL</Label>
            <Input placeholder="https://..." />
          </TextField>
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
      </ModalContainer>
      </ModalBackdrop>
    </Modal>
  );
}

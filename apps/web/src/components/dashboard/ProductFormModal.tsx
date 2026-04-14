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
  TextArea,
  TextField,
} from "@heroui/react";
import { ToggleSwitch } from "../shared/ToggleSwitch";
import { Plus, TrashBin } from "@gravity-ui/icons";
import {
  MODIFIER_TYPES,
  MODIFIER_TYPE_LABELS,
  type ModifierOptionEntity,
  type ModifierType,
  type ProductEntity,
} from "@repo/interfaces";
import { authenticatedFetch } from "@repo/lib";
import { useApiQuery } from "@repo/hooks";
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

interface ModifierDraft {
  $id?: string;
  name: string;
  priceDelta: number;
  type: ModifierType[];
  isAvailable: boolean;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Called once the product row (create or update) is saved.
   * Must return the product ID so modifiers can be attached.
   */
  onSaveProduct: (data: ProductFormData) => Promise<string>;
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
  onSaveProduct,
  product,
  isLoading,
}: ProductFormModalProps) {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [modifiers, setModifiers] = useState<ModifierDraft[]>([]);
  const [savingModifiers, setSavingModifiers] = useState(false);

  const { data: existingModifiers } = useApiQuery<{
    data: ModifierOptionEntity[];
    total: number;
  }>({
    request: { url: `/v1/modifier-option?productId=${product?.$id}` },
    queryKey: ["modifier-option", product?.$id],
    enabled: !!product?.$id && isOpen,
  });

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
      setModifiers([]);
    }
  }, [product, isOpen]);

  useEffect(() => {
    if (existingModifiers?.data) {
      setModifiers(
        existingModifiers.data.map((m) => ({
          $id: m.$id,
          name: m.name,
          priceDelta: m.priceDelta,
          type: (m.type ?? []) as ModifierType[],
          isAvailable: m.isAvailable ?? true,
        })),
      );
    }
  }, [existingModifiers]);

  const isEditing = !!product;

  const syncModifiers = async (
    productId: string,
    existing: ModifierOptionEntity[],
  ) => {
    const keptIds = new Set<string>();
    const promises: Promise<unknown>[] = [];

    for (const mod of modifiers) {
      if (!mod.name.trim()) continue;
      const payload = {
        product: productId,
        name: mod.name.trim(),
        priceDelta: mod.priceDelta,
        type: mod.type,
        isAvailable: mod.isAvailable,
      };
      if (mod.$id) {
        keptIds.add(mod.$id);
        promises.push(
          authenticatedFetch(`/v1/modifier-option/${mod.$id}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: payload.name,
              priceDelta: payload.priceDelta,
              type: payload.type,
              isAvailable: payload.isAvailable,
            }),
          }),
        );
      } else {
        promises.push(
          authenticatedFetch("/v1/modifier-option", {
            method: "POST",
            body: JSON.stringify(payload),
          }),
        );
      }
    }

    for (const m of existing) {
      if (!keptIds.has(m.$id)) {
        promises.push(
          authenticatedFetch(`/v1/modifier-option/${m.$id}`, {
            method: "DELETE",
          }),
        );
      }
    }

    await Promise.all(promises);
  };

  const handleSubmit = async () => {
    setSavingModifiers(true);
    try {
      const productId = await onSaveProduct(form);
      await syncModifiers(productId, existingModifiers?.data ?? []);
      onClose();
    } finally {
      setSavingModifiers(false);
    }
  };

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateModifier = (index: number, update: Partial<ModifierDraft>) => {
    setModifiers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, ...update } : m)),
    );
  };

  const addModifier = () =>
    setModifiers((prev) => [
      ...prev,
      { name: "", priceDelta: 0, type: [], isAvailable: true },
    ]);

  const removeModifier = (index: number) =>
    setModifiers((prev) => prev.filter((_, i) => i !== index));

  const toggleModifierType = (index: number, type: ModifierType) => {
    setModifiers((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        const has = m.type.includes(type);
        return {
          ...m,
          type: has ? m.type.filter((t) => t !== type) : [...m.type, type],
        };
      }),
    );
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
              onChange={(v) =>
                updateField("basePrice", Number.parseFloat(v) || 0)
              }
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

          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Extras / Modifikatoren</span>
              <Button
                size="sm"
                variant="flat"
                startContent={<Plus className="size-4" />}
                onPress={addModifier}
              >
                Hinzufügen
              </Button>
            </div>
            {modifiers.length === 0 ? (
              <p className="text-xs text-muted">
                Keine Extras. Kunden bestellen das Produkt ohne Optionen.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {modifiers.map((m, idx) => (
                  <div
                    key={m.$id ?? `new-${idx}`}
                    className="flex flex-col gap-2 rounded-md border border-border p-2"
                  >
                    <div className="flex items-end gap-2">
                      <TextField
                        value={m.name}
                        onChange={(v) => updateModifier(idx, { name: v })}
                        className="flex-1"
                      >
                        <Label className="text-xs">Name</Label>
                        <Input placeholder="z.B. Extra Käse" />
                      </TextField>
                      <TextField
                        value={String(m.priceDelta)}
                        onChange={(v) =>
                          updateModifier(idx, {
                            priceDelta: Number.parseFloat(v) || 0,
                          })
                        }
                        className="w-32"
                      >
                        <Label className="text-xs">Aufpreis (EUR)</Label>
                        <Input type="number" step={0.01} />
                      </TextField>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        aria-label="Modifikator entfernen"
                        onPress={() => removeModifier(idx)}
                      >
                        <TrashBin className="size-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted">Kategorie:</span>
                      {MODIFIER_TYPES.map((t) => {
                        const active = m.type.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleModifierType(idx, t)}
                            className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                              active
                                ? "bg-accent text-accent-foreground"
                                : "bg-surface-secondary text-muted"
                            }`}
                          >
                            {MODIFIER_TYPE_LABELS[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <ToggleSwitch
              isSelected={form.isAvailable}
              onChange={(v) => updateField("isAvailable", v)}
            >
              Verfügbar
            </ToggleSwitch>
            <ToggleSwitch
              isSelected={form.isFeatured}
              onChange={(v) => updateField("isFeatured", v)}
            >
              Empfohlen
            </ToggleSwitch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Abbrechen
          </Button>
          <Button
            className="bg-accent text-accent-foreground font-semibold"
            onPress={handleSubmit}
            isLoading={isLoading || savingModifiers}
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

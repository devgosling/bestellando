import {
  Button,
  Input,
  Select,
  ListBoxItem,
  Switch,
  TextArea,
} from "@heroui/react";
import type { RestaurantEntity, RestaurantType } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { useState, useEffect } from "react";

interface SettingsFormData {
  name: string;
  description: string;
  phone: string;
  type: RestaurantType;
  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
}

interface RestaurantSettingsFormProps {
  restaurant: RestaurantEntity;
  onSubmit: (data: SettingsFormData) => void;
  isLoading?: boolean;
}

const restaurantTypes = Object.entries(RestaurantTypeNames).map(
  ([key, label]) => ({
    key,
    label,
  }),
);

export function RestaurantSettingsForm({
  restaurant,
  onSubmit,
  isLoading,
}: RestaurantSettingsFormProps) {
  const [form, setForm] = useState<SettingsFormData>({
    name: restaurant.name,
    description: restaurant.description,
    phone: restaurant.phone,
    type: restaurant.type,
    minOrderValue: restaurant.minOrderValue,
    deliveryFee: restaurant.deliveryFee,
    estimatedDeliveryMinutes: restaurant.estimatedDeliveryMinutes,
    isActive: restaurant.isActive,
  });

  useEffect(() => {
    setForm({
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      type: restaurant.type,
      minOrderValue: restaurant.minOrderValue,
      deliveryFee: restaurant.deliveryFee,
      estimatedDeliveryMinutes: restaurant.estimatedDeliveryMinutes,
      isActive: restaurant.isActive,
    });
  }, [restaurant]);

  const updateField = <K extends keyof SettingsFormData>(
    key: K,
    value: SettingsFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Allgemein</h3>
        <Input
          label="Restaurantname"
          value={form.name}
          onValueChange={(v) => updateField("name", v)}
          isRequired
        />
        <TextArea
          label="Beschreibung"
          value={form.description}
          onValueChange={(v) => updateField("description", v)}
          minRows={3}
        />
        <Input
          label="Telefon"
          value={form.phone}
          onValueChange={(v) => updateField("phone", v)}
          type="tel"
        />
        <Select
          label="Restauranttyp"
          selectedKeys={[form.type]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as RestaurantType | undefined;
            if (selected) updateField("type", selected);
          }}
        >
          {restaurantTypes.map((t) => (
            <ListBoxItem key={t.key}>{t.label}</ListBoxItem>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Lieferung & Bestellung</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Mindestbestellwert (EUR)"
            type="number"
            value={String(form.minOrderValue)}
            onValueChange={(v) =>
              updateField("minOrderValue", parseFloat(v) || 0)
            }
            min={0}
            step={0.5}
          />
          <Input
            label="Liefergebuehr (EUR)"
            type="number"
            value={String(form.deliveryFee)}
            onValueChange={(v) =>
              updateField("deliveryFee", parseFloat(v) || 0)
            }
            min={0}
            step={0.5}
          />
          <Input
            label="Lieferzeit (Min.)"
            type="number"
            value={String(form.estimatedDeliveryMinutes)}
            onValueChange={(v) =>
              updateField("estimatedDeliveryMinutes", parseInt(v) || 0)
            }
            min={0}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Status</h3>
        <Switch
          isSelected={form.isActive}
          onValueChange={(v) => updateField("isActive", v)}
        >
          Restaurant aktiv (sichtbar fuer Kunden)
        </Switch>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-accent text-accent-foreground font-semibold"
          onPress={() => onSubmit(form)}
          isLoading={isLoading}
          isDisabled={!form.name.trim()}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

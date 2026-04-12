import {
  Button,
  Input,
  Label,
  Select,
  ListBoxItem,
  Switch,
  TextArea,
  TextField,
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
        <TextField
          value={form.name}
          onChange={(v) => updateField("name", v)}
          isRequired
        >
          <Label>Restaurantname</Label>
          <Input />
        </TextField>
        <TextField
          value={form.description}
          onChange={(v) => updateField("description", v)}
        >
          <Label>Beschreibung</Label>
          <TextArea rows={3} />
        </TextField>
        <TextField
          value={form.phone}
          onChange={(v) => updateField("phone", v)}
        >
          <Label>Telefon</Label>
          <Input type="tel" />
        </TextField>
        <Select
          selectedKeys={[form.type]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as RestaurantType | undefined;
            if (selected) updateField("type", selected);
          }}
        >
          <Label>Restauranttyp</Label>
          {restaurantTypes.map((t) => (
            <ListBoxItem key={t.key}>{t.label}</ListBoxItem>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Lieferung & Bestellung</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            value={String(form.minOrderValue)}
            onChange={(v) =>
              updateField("minOrderValue", Number.parseFloat(v) || 0)
            }
          >
            <Label>Mindestbestellwert (EUR)</Label>
            <Input type="number" min={0} step={0.5} />
          </TextField>
          <TextField
            value={String(form.deliveryFee)}
            onChange={(v) =>
              updateField("deliveryFee", Number.parseFloat(v) || 0)
            }
          >
            <Label>Liefergebuehr (EUR)</Label>
            <Input type="number" min={0} step={0.5} />
          </TextField>
          <TextField
            value={String(form.estimatedDeliveryMinutes)}
            onChange={(v) =>
              updateField("estimatedDeliveryMinutes", Number.parseInt(v) || 0)
            }
          >
            <Label>Lieferzeit (Min.)</Label>
            <Input type="number" min={0} />
          </TextField>
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

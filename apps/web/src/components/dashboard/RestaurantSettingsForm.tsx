import {
  Button,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Select,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  TextArea,
  TextField,
} from "@heroui/react";
import { ToggleSwitch } from "../shared/ToggleSwitch";
import type { RestaurantEntity, RestaurantType } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { useState, useEffect } from "react";

interface RestaurantPatch {
  name: string;
  description: string;
  phone: string;
  type: RestaurantType;
  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;
  isActive: boolean;
}

interface AddressPatch {
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
}

export interface SettingsFormData {
  restaurant: RestaurantPatch;
  address: AddressPatch;
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

function buildInitial(restaurant: RestaurantEntity): SettingsFormData {
  return {
    restaurant: {
      name: restaurant.name,
      description: restaurant.description,
      phone: restaurant.phone,
      type: restaurant.type,
      minOrderValue: restaurant.minOrderValue,
      deliveryFee: restaurant.deliveryFee,
      estimatedDeliveryMinutes: restaurant.estimatedDeliveryMinutes,
      isActive: restaurant.isActive,
    },
    address: {
      street: restaurant.address?.street ?? "",
      streetNumber: restaurant.address?.streetNumber ?? "",
      zipCode: restaurant.address?.zipCode ?? "",
      city: restaurant.address?.city ?? "",
    },
  };
}

export function RestaurantSettingsForm({
  restaurant,
  onSubmit,
  isLoading,
}: RestaurantSettingsFormProps) {
  const [form, setForm] = useState<SettingsFormData>(() =>
    buildInitial(restaurant),
  );

  useEffect(() => {
    setForm(buildInitial(restaurant));
  }, [restaurant]);

  const updateField = <K extends keyof SettingsFormData["restaurant"]>(
    key: K,
    value: SettingsFormData["restaurant"][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      restaurant: { ...prev.restaurant, [key]: value },
    }));
  };

  const updateAddress = <K extends keyof SettingsFormData["address"]>(
    key: K,
    value: SettingsFormData["address"][K],
  ) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [key]: value },
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Allgemein</h3>
        <TextField
          value={form.restaurant.name}
          onChange={(v) => updateField("name", v)}
          isRequired
        >
          <Label>Restaurantname</Label>
          <Input />
        </TextField>
        <TextField
          value={form.restaurant.description}
          onChange={(v) => updateField("description", v)}
        >
          <Label>Beschreibung</Label>
          <TextArea rows={3} />
        </TextField>
        <TextField
          value={form.restaurant.phone}
          onChange={(v) => updateField("phone", v)}
        >
          <Label>Telefon</Label>
          <Input type="tel" />
        </TextField>
        <Select
          selectedKey={form.restaurant.type}
          onSelectionChange={(key) => {
            if (key) updateField("type", key as RestaurantType);
          }}
        >
          <Label>Restauranttyp</Label>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectPopover>
            <ListBox>
              {restaurantTypes.map((t) => (
                <ListBoxItem key={t.key} id={t.key}>
                  {t.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </SelectPopover>
        </Select>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Lieferung & Bestellung</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField
            value={String(form.restaurant.minOrderValue)}
            onChange={(v) =>
              updateField("minOrderValue", Number.parseFloat(v) || 0)
            }
          >
            <Label>Mindestbestellwert (EUR)</Label>
            <Input type="number" min={0} step={0.5} />
          </TextField>
          <TextField
            value={String(form.restaurant.deliveryFee)}
            onChange={(v) =>
              updateField("deliveryFee", Number.parseFloat(v) || 0)
            }
          >
            <Label>Liefergebühr (EUR)</Label>
            <Input type="number" min={0} step={0.5} />
          </TextField>
          <TextField
            value={String(form.restaurant.estimatedDeliveryMinutes)}
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
        <h3 className="text-lg font-semibold">Adresse</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem]">
          <TextField
            value={form.address.street}
            onChange={(v) => updateAddress("street", v)}
          >
            <Label>Straße</Label>
            <Input />
          </TextField>
          <TextField
            value={form.address.streetNumber}
            onChange={(v) => updateAddress("streetNumber", v)}
          >
            <Label>Hausnummer</Label>
            <Input />
          </TextField>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[8rem_1fr]">
          <TextField
            value={form.address.zipCode}
            onChange={(v) => updateAddress("zipCode", v)}
          >
            <Label>PLZ</Label>
            <Input />
          </TextField>
          <TextField
            value={form.address.city}
            onChange={(v) => updateAddress("city", v)}
          >
            <Label>Stadt</Label>
            <Input />
          </TextField>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Status</h3>
        <ToggleSwitch
          isSelected={form.restaurant.isActive}
          onChange={(v) => updateField("isActive", v)}
        >
          Restaurant aktiv (sichtbar für Kunden)
        </ToggleSwitch>
      </div>

      <div className="flex justify-end">
        <Button
          className="bg-accent text-accent-foreground font-semibold"
          onPress={() => onSubmit(form)}
          isLoading={isLoading}
          isDisabled={!form.restaurant.name.trim()}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

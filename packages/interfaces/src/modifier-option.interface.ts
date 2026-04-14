import type { ProductEntity } from "./product.interface.js";

/**
 * Appwrite stores this as an enum array. The frontend lets the user pick from
 * these known values when creating a modifier; the Appwrite enum must contain
 * matching values.
 */
export const MODIFIER_TYPES = [
  "SAUCE",
  "TOPPING",
  "SIZE",
  "EXTRA",
  "SIDE",
  "OTHER",
] as const;

export type ModifierType = (typeof MODIFIER_TYPES)[number];

export const MODIFIER_TYPE_LABELS: Record<ModifierType, string> = {
  SAUCE: "Sauce",
  TOPPING: "Topping",
  SIZE: "Größe",
  EXTRA: "Extra",
  SIDE: "Beilage",
  OTHER: "Sonstiges",
};

export interface ModifierOptionEntity {
  $id: string;
  product: ProductEntity | string;
  name: string;
  priceDelta: number;
  isDefault: boolean;
  isAvailable: boolean;
  type: ModifierType[];
}

export interface OrderItemModifierEntity {
  $id: string;
  orderItem: string;
  modifierOption: ModifierOptionEntity | string;
  deltaPrice: number;
}

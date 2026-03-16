import type { AddressEntity } from "./address.interface.js";

export const RestaurantTypeNames: Record<RestaurantType, string> = {
  italian: "Italienisch",
  chinese: "Chinesisch",
  fast_food: "Fast Food",
  vegetarian: "Vegetarisch",
  vegan: "Vegan",
  dessert: "Dessert",
  mexican: "Mexikanisch",
  indian: "Indisch",
  asian: "Asiatisch",
  other: "Andere",
};

export type RestaurantType =
  | "italian"
  | "chinese"
  | "fast_food"
  | "vegetarian"
  | "vegan"
  | "dessert"
  | "mexican"
  | "indian"
  | "asian"
  | "other";

export interface RestaurantEntity {
  $id: string;
  name: string;
  description: string;
  phone: string;
  address: AddressEntity;
  type: RestaurantType;

  imageUrl?: string;
  bannerUrl?: string;

  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;

  isActive: boolean;
}

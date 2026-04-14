import type { RestaurantEntity } from "./restaurant.interface.js";

export interface DeliveryZoneEntity {
  $id: string;
  maxRadiusKm: number;
  deliveryFeeOverride: number;
  restaurant: RestaurantEntity | string;
}

import type { RestaurantEntity } from "./restaurant.interface.js";

export interface OpeningHoursEntity {
  $id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  restaurant: RestaurantEntity;
}

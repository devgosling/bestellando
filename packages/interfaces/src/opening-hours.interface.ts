import { RestaurantEntity } from "./restaurant.interface";

export interface OpeningHoursEntity {
  $id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  restaurant: RestaurantEntity;
}

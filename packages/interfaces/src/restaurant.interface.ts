import { AddressEntity } from "./address.interface";

export interface RestaurantEntity {
  $id: string;
  name: string;
  description: string;
  phone: string;
  address: AddressEntity;

  imageUrl?: string;
  bannerUrl?: string;

  minOrderValue: number;
  deliveryFee: number;
  estimatedDeliveryMinutes: number;

  isActive: boolean;
}

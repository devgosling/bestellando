import { RestaurantEntity } from "./restaurant.interface.js";

export interface ProductEntity {
    $id: string;
    restaurant: RestaurantEntity;
    name: string;
    description: string;
    basePrice: number;
    imageUrl?: string;
    isAvailable: boolean;
    isFeatured: boolean;
    prepTimeMinutes: number;
}
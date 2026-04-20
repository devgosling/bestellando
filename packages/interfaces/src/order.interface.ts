import { AddressEntity } from "./address.interface.js";
import { RestaurantEntity } from "./restaurant.interface.js";
export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "PICKED_UP" | "DELIVERED" | "CANCELLED";

export interface OrderEntity {
    $id: string;
    restaurant: RestaurantEntity | string;
    deliveryAddress: AddressEntity | string;
    currentStatus: OrderStatus;
    subtotal: number;
    deliveryFee: number;
    totalAmount: number;
    specialInstructions?: string;
    customer: string;
    $createdAt?: string;
    $updatedAt?: string;
}
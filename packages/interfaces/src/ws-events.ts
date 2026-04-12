import { OrderEntity, OrderStatus } from "./order.interface.js";
import { OrderItemEntity } from "./order-item.interface.js";
import { AddressEntity } from "./address.interface.js";

// Server -> Client events
export interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}

export interface NewOrderEvent {
  order: OrderEntity;
  items: OrderItemEntity[];
}

export interface DriverLocationEvent {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface DeliveryAvailableEvent {
  orderId: string;
  restaurantName: string;
  pickupAddress: AddressEntity;
  deliveryAddress: AddressEntity;
}

export interface DeliveryAssignedEvent {
  driverId: string;
  driverName: string;
  estimatedMinutes: number;
}

export interface RestaurantAvailabilityEvent {
  restaurantId: string;
  isActive: boolean;
}

export interface ProductAvailabilityEvent {
  productId: string;
  isAvailable: boolean;
}

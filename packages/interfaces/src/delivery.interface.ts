import { Point } from "geojson";

export type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";

export interface DeliveryEntity {
  $id: string;
  order: string;
  deliveryPerson: string;
  status: DeliveryStatus;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  currentLocation?: Point;
  estimatedArrivalMinutes?: number;
}

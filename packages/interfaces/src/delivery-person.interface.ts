import { Point } from "geojson";

export type VehicleType = "BICYCLE" | "SCOOTER" | "CAR";

export interface DeliveryPersonEntity {
  $id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isAvailable: boolean;
  currentLocation?: Point;
  rating?: number;
}

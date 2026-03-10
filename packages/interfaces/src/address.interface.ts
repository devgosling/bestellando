import { Point } from "geojson";

export interface AddressEntity {
  $id: string;
  ownerType: "RESTAURANT" | "CUSTOMER";
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  isDefault: boolean;
  coordinates: Point;
}

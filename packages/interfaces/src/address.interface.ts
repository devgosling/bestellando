import { Point } from "geojson";

export type AddressOwnerType = "RESTAURANT" | "CUSTOMER";

export interface AddressEntity {
  $id: string;
  ownerType: AddressOwnerType;
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  isDefault: boolean;
  coordinates: Point;
}

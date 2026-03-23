import { Point } from "geojson";

export type AddressOwnerType = "RESTAURANT" | "CUSTOMER";

export interface AddressEntity {
  $id: string;
  ownerType: AddressOwnerType;
  ownerId: string;
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  isDefault: boolean;
  coordinates: Point;
}

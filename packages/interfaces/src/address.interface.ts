export type AddressOwnerType = "RESTAURANT" | "CUSTOMER";

export type Coordinates = [longitude: number, latitude: number];

export interface AddressEntity {
  $id: string;
  ownerType: AddressOwnerType;
  ownerId: string;
  street: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  isDefault: boolean;
  coordinates: Coordinates;
}

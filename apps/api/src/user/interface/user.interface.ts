export interface User {
  type: "CUSTOMER" | "DELIVERY_PERSON" | "RESTAURANT" | "ADMIN";
}

export type UserType = User["type"];

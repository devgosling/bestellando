export interface User {
  type: "CUSTOMER" | "DELIVER_PERSON" | "RESTAURANT" | "ADMIN";
}

export type UserType = User["type"];

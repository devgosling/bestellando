import { IsIn, IsString } from "class-validator";
import type { OrderStatus } from "@repo/interfaces";

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "PICKED_UP",
    "DELIVERED",
    "CANCELLED",
  ])
  status: OrderStatus;
}

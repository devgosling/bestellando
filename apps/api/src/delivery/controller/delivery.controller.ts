import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
} from "@nestjs/common";
import { DeliveryService } from "../service/delivery.service";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({
  version: "1",
  path: "delivery",
})
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get("available")
  @RequireUserType(["DELIVERY_PERSON"])
  async getAvailable() {
    return this.deliveryService.getAvailableDeliveries();
  }

  @Get("mine")
  @RequireUserType(["DELIVERY_PERSON"])
  async getMyDeliveries(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.deliveryService.getMyDeliveries(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 25,
    );
  }

  @Post("accept/:orderId")
  @RequireUserType(["DELIVERY_PERSON"])
  async accept(@Param("orderId") orderId: string) {
    return this.deliveryService.acceptDelivery(orderId);
  }

  @Patch(":deliveryId/pickup")
  @RequireUserType(["DELIVERY_PERSON"])
  async pickup(@Param("deliveryId") deliveryId: string) {
    return this.deliveryService.markPickedUp(deliveryId);
  }

  @Patch(":deliveryId/delivered")
  @RequireUserType(["DELIVERY_PERSON"])
  async delivered(@Param("deliveryId") deliveryId: string) {
    return this.deliveryService.markDelivered(deliveryId);
  }

  @Get("order/:orderId")
  @RequireUserType(["DELIVERY_PERSON"])
  async getByOrder(@Param("orderId") orderId: string) {
    return this.deliveryService.getDeliveryByOrderId(orderId);
  }
}

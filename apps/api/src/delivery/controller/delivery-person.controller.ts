import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
} from "@nestjs/common";
import { DeliveryPersonService } from "../service/delivery-person.service";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({
  version: "1",
  path: "delivery-person",
})
export class DeliveryPersonController {
  constructor(
    private readonly deliveryPersonService: DeliveryPersonService,
  ) {}

  @Post("register")
  @RequireUserType(["DELIVERY_PERSON"])
  async register(
    @Body() body: { name: string; phone: string; vehicleType: string },
  ) {
    return this.deliveryPersonService.register(body);
  }

  @Get("profile")
  @RequireUserType(["DELIVERY_PERSON"])
  async getProfile() {
    return this.deliveryPersonService.getProfile();
  }

  @Patch("availability")
  @RequireUserType(["DELIVERY_PERSON"])
  async toggleAvailability(@Body() body: { isAvailable: boolean }) {
    return this.deliveryPersonService.toggleAvailability(body.isAvailable);
  }
}

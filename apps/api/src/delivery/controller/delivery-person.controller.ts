import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
} from "@nestjs/common";
import { type DeliveryPersonRegisterDTO } from "@repo/interfaces";
import { DeliveryPersonService } from "../service/delivery-person.service";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";
import { Public } from "../../auth/decorator/public.decorator";

@Controller({
  version: "1",
  path: "delivery-person",
})
export class DeliveryPersonController {
  constructor(
    private readonly deliveryPersonService: DeliveryPersonService,
  ) {}

  @Public()
  @Post("register")
  async register(@Body() body: DeliveryPersonRegisterDTO) {
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

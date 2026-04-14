import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { DeliveryZoneService } from "../service/delivery-zone.service";
import { type DeliveryZoneEntity } from "@repo/interfaces";
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "delivery-zone", version: "1" })
export class DeliveryZoneController {
  constructor(private readonly deliveryZoneService: DeliveryZoneService) {}

  @Post()
  @RequireUserType(["RESTAURANT"])
  create(
    @Body() entity: Partial<DeliveryZoneEntity> & { restaurantId?: string },
  ) {
    return this.deliveryZoneService.createDeliveryZone(entity);
  }

  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.deliveryZoneService.getDeliveryZoneById(id);
  }

  @Get()
  @Public()
  async findAll(@Query("restaurantId") restaurantId?: string) {
    const result =
      await this.deliveryZoneService.getAllDeliveryZones(restaurantId);
    return result.rows;
  }

  @Patch(":id")
  @RequireUserType(["RESTAURANT"])
  update(
    @Param("id") id: string,
    @Body() patch: Partial<DeliveryZoneEntity> & { restaurantId?: string },
  ) {
    return this.deliveryZoneService.updateDeliveryZone(id, patch);
  }

  @Delete(":id")
  @RequireUserType(["RESTAURANT"])
  remove(@Param("id") id: string) {
    return this.deliveryZoneService.deleteDeliveryZone(id);
  }
}

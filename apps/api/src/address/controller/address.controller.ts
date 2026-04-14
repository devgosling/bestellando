import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AddressEntity } from "@repo/interfaces";
import { AddressService } from "../service/address.service";
import { ActorContextService } from "../../auth/service/actor-context.service";

@Controller({
  version: "1",
  path: "address",
})
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Post()
  public async createAddress(
    @Body() body: Partial<AddressEntity>,
  ) {
    const userId = this.actorContextService.get().user.id;
    return this.addressService.createAddress("CUSTOMER", {
      ...body,
      ownerId: userId,
      ownerType: "CUSTOMER",
    });
  }

  @Get()
  public async getMyAddresses() {
    const userId = this.actorContextService.get().user.id;
    return this.addressService.getMyAddresses(userId);
  }

  @Get("reverse")
  public async reverseGeocode(
    @Query("lat") lat?: string,
    @Query("lng") lng?: string,
  ) {
    const latNum = lat !== undefined ? Number(lat) : Number.NaN;
    const lngNum = lng !== undefined ? Number(lng) : Number.NaN;
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      throw new BadRequestException("lat and lng must be valid numbers");
    }
    return this.addressService.reverseGeocode(latNum, lngNum);
  }

  @Patch(":id")
  public async updateAddress(
    @Param("id") id: string,
    @Body() patch: Partial<AddressEntity>,
  ) {
    const userId = this.actorContextService.get().user.id;
    await this.addressService.verifyOwnership(id, userId);
    return this.addressService.updateAddress(id, patch);
  }

  @Delete(":id")
  public async deleteAddress(@Param("id") id: string) {
    const userId = this.actorContextService.get().user.id;
    await this.addressService.verifyOwnership(id, userId);
    return this.addressService.deleteAddress(id);
  }

  @Patch(":id/default")
  public async setDefault(@Param("id") id: string) {
    const userId = this.actorContextService.get().user.id;
    await this.addressService.verifyOwnership(id, userId);
    return this.addressService.setDefault(id, userId);
  }
}

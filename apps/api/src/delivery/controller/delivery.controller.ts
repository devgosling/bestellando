import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
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
  async delivered(
    @Param("deliveryId") deliveryId: string,
    @Body() body: { proofImageId: string },
  ) {
    return this.deliveryService.markDelivered(deliveryId, body?.proofImageId);
  }

  @Post(":deliveryId/proof")
  @RequireUserType(["DELIVERY_PERSON"])
  @UseInterceptors(FileInterceptor("file"))
  async uploadProof(
    @Param("deliveryId") deliveryId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    return this.deliveryService.uploadProofImage(deliveryId, file);
  }

  @Get(":deliveryId/proof")
  async streamProof(
    @Param("deliveryId") deliveryId: string,
    @Res() res: Response,
  ) {
    const { buffer } = await this.deliveryService.getProofImage(deliveryId);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(buffer);
  }

  @Get("order/:orderId")
  async getByOrder(@Param("orderId") orderId: string) {
    return this.deliveryService.getDeliveryByOrderId(orderId);
  }

  @Get(":id")
  @RequireUserType(["DELIVERY_PERSON"])
  async getById(@Param("id") id: string) {
    return this.deliveryService.getDeliveryById(id);
  }
}

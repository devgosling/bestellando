import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { DeliveryZoneService } from "./service/delivery-zone.service";
import { DeliveryZoneController } from "./controller/delivery-zone.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [DeliveryZoneService],
  controllers: [DeliveryZoneController],
})
export class DeliveryZoneModule {}

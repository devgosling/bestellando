import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../database/database.module";
import { OrderGateway } from "./orders/order.gateway";
import { DeliveryGateway } from "./delivery/delivery.gateway";
import { GpsStoreService } from "./delivery/gps-store.service";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [AuthModule, ConfigModule, DatabaseModule],
  providers: [OrderGateway, DeliveryGateway, GpsStoreService],
  exports: [OrderGateway, DeliveryGateway],
})
export class GatewayModule {}

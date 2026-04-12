import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OrderStatusHistoryService } from "./service/order-status-history.service";
import { OrderStatusHistoryController } from "./controller/order-status-history.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OrderStatusHistoryService],
  controllers: [OrderStatusHistoryController],
})
export class OrderStatusHistoryModule {}

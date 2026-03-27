import { Module } from "@nestjs/common";
import { OrderStatusHistoryService } from "./service/order-status-history.service";
import { OrderStatusHistoryController } from "./controller/order-status-history.controller";

@Module({
  providers: [OrderStatusHistoryService],
  controllers: [OrderStatusHistoryController],
})
export class OrderStatusHistoryModule {}

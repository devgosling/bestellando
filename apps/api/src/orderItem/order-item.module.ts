import { Module } from "@nestjs/common";
import { OrderItemService } from "./service/order-item.service";
import { OrderItemController } from "./controller/order-item.controller";

@Module({
  providers: [OrderItemService],
  controllers: [OrderItemController],
})
export class OrderItemModule {}

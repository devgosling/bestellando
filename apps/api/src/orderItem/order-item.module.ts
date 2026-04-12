import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OrderItemService } from "./service/order-item.service";
import { OrderItemController } from "./controller/order-item.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OrderItemService],
  controllers: [OrderItemController],
})
export class OrderItemModule {}

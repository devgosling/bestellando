import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OrderItemService } from "./service/order-item.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OrderItemService],
  exports: [OrderItemService],
})
export class OrderItemModule {}

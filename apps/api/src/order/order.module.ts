import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { OrderItemModule } from "../orderItem/order-item.module";
import { OrderStatusHistoryModule } from "../orderStatusHistory/order-status-history.module";
import { UserModule } from "../user/user.module";
import { OrderService } from "./service/order.service";
import { OrderController } from "./controller/order.controller";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    AuthModule,
    OrderItemModule,
    OrderStatusHistoryModule,
    UserModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}

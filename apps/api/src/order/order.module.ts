import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { OrderService } from "./service/order.service";
import { OrderController } from "./controller/order.controller";

@Module({
  imports: [DatabaseModule, ConfigModule, AuthModule],
  providers: [OrderService],
  controllers: [OrderController],
})
export class OrderModule {}

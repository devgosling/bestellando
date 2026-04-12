import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { DeliveryService } from "./service/delivery.service";
import { DeliveryPersonService } from "./service/delivery-person.service";
import { DeliveryController } from "./controller/delivery.controller";
import { DeliveryPersonController } from "./controller/delivery-person.controller";
import { OrderModule } from "../order/order.module";
import { GatewayModule } from "../gateway/gateway.module";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    AuthModule,
    forwardRef(() => OrderModule),
    forwardRef(() => GatewayModule),
  ],
  providers: [DeliveryService, DeliveryPersonService],
  controllers: [DeliveryController, DeliveryPersonController],
  exports: [DeliveryService, DeliveryPersonService],
})
export class DeliveryModule {}

import { Module, forwardRef } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { StripeService } from "./service/stripe.service";
import { PaymentController } from "./controller/payment.controller";
import { WebhookController } from "./controller/webhook.controller";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { OrderModule } from "../order/order.module";
import { GatewayModule } from "../gateway/gateway.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    OrderModule,
    forwardRef(() => GatewayModule),
  ],
  providers: [StripeService],
  controllers: [PaymentController, WebhookController],
})
export class PaymentModule {}

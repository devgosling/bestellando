import { AddressModule } from "./address/address.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ProductModule } from "./product/product.module";
import { OrderModule } from "./order/order.module";
import { OrderItemModule } from "./orderItem/order-item.module";
import { OrderStatusHistoryModule } from "./orderStatusHistory/order-status-history.module";
import { OpeningHoursModule } from "./openingHours/opening-hours.module";
import { ModifierOptionModule } from "./modifierOption/modifier-option.module";
import { PaymentModule } from "./payment/payment.module";
import { GatewayModule } from "./gateway/gateway.module";
import { DeliveryModule } from "./delivery/delivery.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AccessInterceptor } from "./auth/interceptor/access.interceptor";
import { ClsModule } from "nestjs-cls/dist/src/lib/cls-module/cls.module";

@Module({
  imports: [
    AddressModule,
    RestaurantModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    ProductModule,
    OrderModule,
    OrderItemModule,
    OrderStatusHistoryModule,
    OpeningHoursModule,
    ModifierOptionModule,
    PaymentModule,
    GatewayModule,
    DeliveryModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => crypto.randomUUID(),
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AccessInterceptor,
    },
  ],
})
export class AppModule {}

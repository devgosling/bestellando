import { RestaurantController } from "./controller/restaurant.controller";
import { DatabaseModule } from "../database/database.module";
import { RestaurantService } from "./service/restaurant.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule],
  controllers: [RestaurantController],
  providers: [RestaurantService],
})
export class RestaurantModule {}

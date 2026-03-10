import { DatabaseModule } from "src/database/database.module";
import { RestaurantService } from "./service/restaurant.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule],
  controllers: [],
  providers: [RestaurantService],
})
export class RestaurantModule {}

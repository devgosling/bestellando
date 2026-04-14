import { DatabaseModule } from "src/database/database.module";
import { AddressService } from "./service/address.service";
import { GeocodingService } from "./service/geocoding.service";
import { AddressController } from "./controller/address.controller";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule],
  controllers: [AddressController],
  providers: [AddressService, GeocodingService],
})
export class AddressModule {}

import { DatabaseModule } from "src/database/database.module";
import { AddressService } from "./service/address.service";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot(),
    AuthModule
  ],
  controllers: [],
  providers: [AddressService],
})
export class AddressModule {}

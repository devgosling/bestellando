import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { UserModule } from "../user/user.module";
import { ModifierOptionController } from "./controller/modifier-option.controller";
import { ModifierOptionService } from "./service/modifier-option.service";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule, UserModule],
  controllers: [ModifierOptionController],
  providers: [ModifierOptionService],
  exports: [ModifierOptionService],
})
export class ModifierOptionModule {}

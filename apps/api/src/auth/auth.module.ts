/*
https://docs.nestjs.com/modules
*/

import { Module } from "@nestjs/common";
import { JwtStrategy } from "./strategy/jwt.service";
import { ActorContextService } from "./service/actor-context.service";
import { AppwriteService } from "./service/appwrite.service";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { CooldownService } from "./service/cooldown.service";
import { APP_GUARD } from "@nestjs/core/constants";
import { JwtAuthGuard } from "./guard/jwt.guard";
import { UserModule } from "../user/user.module";

@Module({
  imports: [UserModule, ConfigModule.forRoot(), PassportModule],
  controllers: [],
  providers: [
    JwtStrategy,
    ActorContextService,
    AppwriteService,
    CooldownService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [ActorContextService, AppwriteService, JwtStrategy, CooldownService],
})
export class AuthModule {}

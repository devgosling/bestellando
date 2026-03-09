import { UserController } from "./controller/user.controller";
import { UserService } from "./service/user.service";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule, ConfigModule.forRoot()],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

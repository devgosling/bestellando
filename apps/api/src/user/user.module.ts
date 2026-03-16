import { UserController } from "./controller/user.controller";
import { UserService } from "./service/user.service";
import { forwardRef, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [forwardRef(() => AuthModule), ConfigModule.forRoot()],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

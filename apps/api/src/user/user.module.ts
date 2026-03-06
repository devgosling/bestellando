import { UserService } from "./service/user.service";
import { Module } from "@nestjs/common";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [UserService],
})
export class UserModule {}

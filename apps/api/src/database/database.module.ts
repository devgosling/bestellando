import { AuthModule } from "../auth/auth.module";
import { DatabaseService } from "./service/database.service";
import { Module } from "@nestjs/common";

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

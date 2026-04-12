import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OpeningHoursService } from "./service/opening-hours.service";
import { OpeningHoursController } from "./controller/opening-hours.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OpeningHoursService],
  controllers: [OpeningHoursController],
})
export class OpeningHoursModule {}

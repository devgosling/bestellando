import { Module } from "@nestjs/common";
import { OpeningHoursService } from "./service/opening-hours.service";
import { OpeningHoursController } from "./controller/opening-hours.controller";

@Module({
  providers: [OpeningHoursService],
  controllers: [OpeningHoursController],
})
export class OpeningHoursModule {}

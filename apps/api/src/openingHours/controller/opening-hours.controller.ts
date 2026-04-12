import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { OpeningHoursService } from "../service/opening-hours.service";
import { type OpeningHoursEntity } from "@repo/interfaces";

@Controller({ path: "opening-hours", version: "1" })
export class OpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @Post()
  create(@Body() entity: OpeningHoursEntity) {
    return this.openingHoursService.createOpeningHours(entity);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.openingHoursService.getOpeningHoursById(id);
  }

  @Get()
  findAll() {
    return this.openingHoursService.getAllOpeningHours();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() entity: Partial<OpeningHoursEntity>) {
    return this.openingHoursService.updateOpeningHours(id, entity);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.openingHoursService.deleteOpeningHours(id);
  }
}

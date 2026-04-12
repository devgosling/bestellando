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
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "opening-hours", version: "1" })
export class OpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @Post()
  @RequireUserType(["RESTAURANT"])
  create(@Body() entity: OpeningHoursEntity) {
    return this.openingHoursService.createOpeningHours(entity);
  }

  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.openingHoursService.getOpeningHoursById(id);
  }

  @Get()
  @Public()
  findAll() {
    return this.openingHoursService.getAllOpeningHours();
  }

  @Patch(":id")
  @RequireUserType(["RESTAURANT"])
  update(@Param("id") id: string, @Body() entity: Partial<OpeningHoursEntity>) {
    return this.openingHoursService.updateOpeningHours(id, entity);
  }

  @Delete(":id")
  @RequireUserType(["RESTAURANT"])
  remove(@Param("id") id: string) {
    return this.openingHoursService.deleteOpeningHours(id);
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";
import { ModifierOptionService } from "../service/modifier-option.service";
import {
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
} from "../dto/modifier-option.dto";

@Controller({ path: "modifier-option", version: "1" })
export class ModifierOptionController {
  constructor(private readonly service: ModifierOptionService) {}

  @Public()
  @Get()
  async list(@Query("productId") productId?: string) {
    if (!productId) {
      throw new BadRequestException("productId is required");
    }
    return this.service.listByProduct(productId);
  }

  @Public()
  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.getById(id);
  }

  @RequireUserType(["RESTAURANT"])
  @Post()
  create(@Body() dto: CreateModifierOptionDto) {
    return this.service.create(dto);
  }

  @RequireUserType(["RESTAURANT"])
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateModifierOptionDto) {
    return this.service.update(id, dto);
  }

  @RequireUserType(["RESTAURANT"])
  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.service.delete(id);
  }
}

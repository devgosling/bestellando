import { IsBoolean, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";

// RestaurantType values: "italian" | "chinese" | "fast_food" | "vegetarian" | "vegan" | "dessert" | "mexican" | "indian" | "asian" | "other"

export class RestaurantFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean;
}

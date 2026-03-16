import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from "class-validator";
import type { RestaurantEntity } from "./restaurant.interface.js";

export class CreateRestaurantDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  partialAddress!: Partial<RestaurantEntity["address"]>;

  data!: Partial<RestaurantEntity>;
}

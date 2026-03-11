import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from "class-validator";
import { RestaurantEntity } from "./restaurant.interface";

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

  data!: Partial<RestaurantEntity>;
}

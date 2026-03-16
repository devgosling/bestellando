/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Post } from "@nestjs/common";
import { RestaurantService } from "../service/restaurant.service";
import { Public } from "../../auth/decorator/public.decorator";
import { CreateRestaurantDto } from "@repo/interfaces";

@Controller({
  version: "1",
  path: "restaurant",
})
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Public()
  @Post("register")
  private async registerRestaurant(@Body() body: CreateRestaurantDto) {
    return this.restaurantService.createRestaurant(body);
  }
}

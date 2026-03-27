/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Post, Get, Patch, Param, Req, ImATeapotException } from "@nestjs/common";
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

  @Get("list")
  public async listRestaurants() {
    //return this.restaurantService.listRestaurants();
    throw new ImATeapotException("Not implemented yet");
  }

  @Get("mine")
  public async getMyRestaurants(@Req() req) {
    return this.restaurantService.getRestaurantFromUser();
  }

  @Patch(":id")
  public async updateRestaurant(
    @Param("id") id: string,
    @Body() patch: Partial<CreateRestaurantDto>,
  ) {
    return this.restaurantService.updateRestaurant(id, patch);
  }
}

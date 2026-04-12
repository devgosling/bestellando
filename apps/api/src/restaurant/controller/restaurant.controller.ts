/*
https://docs.nestjs.com/controllers#controllers
*/

import { Body, Controller, Post, Get, Patch, Param, Query, Req, ForbiddenException } from "@nestjs/common";
import { RestaurantService } from "../service/restaurant.service";
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";
import { Cooldown } from "../../auth/decorator/cooldown.decorator";
import { CreateRestaurantDto } from "@repo/interfaces";
import { RestaurantFilterDto } from "../dto/restaurant-filter.dto";

@Controller({
  version: "1",
  path: "restaurant",
})
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Public()
  @Post("register")
  @Cooldown(60)
  private async registerRestaurant(@Body() body: CreateRestaurantDto) {
    return this.restaurantService.createRestaurant(body);
  }

  @Public()
  @Get("list")
  public async listRestaurants(@Query() filters: RestaurantFilterDto) {
    return this.restaurantService.listRestaurants(filters);
  }

  @Get("mine")
  public async getMyRestaurants(@Req() req) {
    const result = await this.restaurantService.getRestaurantFromUser();
    return (result as any).rows ?? (result as any).documents ?? [];
  }

  @Patch(":id")
  @RequireUserType(["RESTAURANT"])
  public async updateRestaurant(
    @Param("id") id: string,
    @Body() patch: Partial<CreateRestaurantDto>,
  ) {
    // Verify caller owns this restaurant
    const myRestaurants = await this.restaurantService.getRestaurantFromUser();
    const docs = (myRestaurants as any).documents ?? (myRestaurants as any).rows ?? [];
    const ownsRestaurant = docs.some(
      (r: any) => r.$id === id,
    );
    if (!ownsRestaurant) {
      throw new ForbiddenException("You do not own this restaurant");
    }
    return this.restaurantService.updateRestaurant(id, patch);
  }

  @Public()
  @Get(":id")
  public async getRestaurantById(@Param("id") id: string) {
    return this.restaurantService.getRestaurantById(id);
  }
}

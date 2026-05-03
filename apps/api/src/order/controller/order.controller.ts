import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { OrderService } from "../service/order.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderStatusDto } from "../dto/update-order-status.dto";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "order", version: "1" })
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }

  @Get("mine")
  async getMyOrders(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.orderService.getMyOrders(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 25,
    );
  }

  @Get("restaurant/:restaurantId")
  @RequireUserType(["RESTAURANT"])
  async getRestaurantOrders(
    @Param("restaurantId") restaurantId: string,
    @Query("limit") limit?: string,
  ) {
    return this.orderService.getRestaurantOrders(
      restaurantId,
      limit ? parseInt(limit) : 25,
    );
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.orderService.getOrderById(id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.transitionStatus(id, dto);
  }

  @Get(":id/items")
  async getItems(@Param("id") id: string) {
    const result = await this.orderService.getOrderItems(id);
    return { data: result.rows, total: result.total };
  }

  @Get(":id/history")
  async getHistory(@Param("id") id: string) {
    const result = await this.orderService.getStatusHistory(id);
    return { data: result.rows, total: result.total };
  }
}

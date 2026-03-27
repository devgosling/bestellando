import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { type OrderEntity } from "@repo/interfaces";
import { OrderService } from "../service/order.service";

@Controller("order")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(@Body() order: OrderEntity) {
    return this.orderService.createOrder(order);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderService.getOrderById(id);
  }

  @Get()
  findAll() {
    return this.orderService.getAllOrders();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() order: Partial<OrderEntity>) {
    return this.orderService.updateOrder(id, order);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.orderService.deleteOrder(id);
  }
}

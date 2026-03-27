import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { OrderItemService } from "../service/order-item.service";
import { type OrderItemEntity } from "@repo/interfaces";

@Controller("order-item")
export class OrderItemController {
  constructor(private readonly orderItemService: OrderItemService) {}

  @Post()
  create(@Body() entity: OrderItemEntity) {
    return this.orderItemService.createOrderItem(entity);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderItemService.getOrderItemById(id);
  }

  @Get()
  findAll() {
    return this.orderItemService.getAllOrderItems();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() entity: Partial<OrderItemEntity>) {
    return this.orderItemService.updateOrderItem(id, entity);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.orderItemService.deleteOrderItem(id);
  }
}

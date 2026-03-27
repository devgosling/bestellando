import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { OrderStatusHistoryService } from "../service/order-status-history.service";
import { type OrderStatusHistoryEntity } from "@repo/interfaces";

@Controller("order-status-history")
export class OrderStatusHistoryController {
  constructor(
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
  ) {}

  @Post()
  create(@Body() entity: OrderStatusHistoryEntity) {
    return this.orderStatusHistoryService.createOrderStatusHistory(entity);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.orderStatusHistoryService.getOrderStatusHistoryById(id);
  }

  @Get()
  findAll() {
    return this.orderStatusHistoryService.getAllOrderStatusHistories();
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() entity: Partial<OrderStatusHistoryEntity>,
  ) {
    return this.orderStatusHistoryService.updateOrderStatusHistory(id, entity);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.orderStatusHistoryService.deleteOrderStatusHistory(id);
  }
}

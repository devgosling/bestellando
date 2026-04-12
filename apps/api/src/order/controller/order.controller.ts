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
import { ActorContextService } from "../../auth/service/actor-context.service";

@Controller({ path: "order", version: "1" })
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Post()
  create(@Body() order: OrderEntity) {
    return this.orderService.createOrder(order);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    const userId = this.actorContextService.get().user.id;
    return this.orderService.getOrderById(id, userId);
  }

  @Get()
  findAll() {
    const userId = this.actorContextService.get().user.id;
    return this.orderService.getAllOrders(userId);
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

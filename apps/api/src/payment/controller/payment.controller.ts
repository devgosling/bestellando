import { Controller, Post, Param, BadRequestException } from "@nestjs/common";
import { StripeService } from "../service/stripe.service";
import { OrderService } from "../../order/service/order.service";
import { ActorContextService } from "../../auth/service/actor-context.service";

@Controller({ path: "payment", version: "1" })
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Post("checkout/:orderId")
  async createCheckoutSession(@Param("orderId") orderId: string) {
    const userId = this.actorContextService.get().user.id;
    const order = await this.orderService.getOrderById(orderId);

    if (!order) throw new BadRequestException("Order not found");
    if (order.customerId !== userId)
      throw new BadRequestException("Order does not belong to you");
    if (order.currentStatus !== "PENDING")
      throw new BadRequestException("Order is not in PENDING status");
    if (order.paymentStatus === "PAID")
      throw new BadRequestException("Order is already paid");

    // Get order items to build line items
    const itemsResult = await this.orderService.getOrderItems(orderId);
    const items = itemsResult.rows || [];

    const lineItems = items.map((item: any) => ({
      name: `Product ${item.product}`,
      quantity: item.quantity,
      unitAmount: Math.round(item.unitPrice * 100), // convert EUR to cents
    }));

    // Add delivery fee as line item if > 0
    if (order.deliveryFee > 0) {
      lineItems.push({
        name: "Liefergebühr",
        quantity: 1,
        unitAmount: Math.round(order.deliveryFee * 100),
      });
    }

    const session = await this.stripeService.createCheckoutSession({
      orderId,
      restaurantId: order.restaurant,
      amount: Math.round(order.totalAmount * 100),
      lineItems,
    });

    return { sessionUrl: session.url };
  }
}

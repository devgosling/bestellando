import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Inject,
  forwardRef,
  Req,
} from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { StripeService } from "../service/stripe.service";
import { Public } from "../../auth/decorator/public.decorator";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { OrderGateway } from "../../gateway/orders/order.gateway";
import type { Request } from "express";

@Controller({ path: "webhook", version: "1" })
export class WebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => OrderGateway))
    private readonly orderGateway: OrderGateway,
  ) {}

  @Public()
  @Post("stripe")
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ) {
    let event: ReturnType<StripeService["constructWebhookEvent"]>;
    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody!,
        signature,
      );
    } catch {
      return { received: false };
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        const dataBase = this.databaseService.getDatabase();
        const databaseId = this.configService.get<string>("DATABASE_ID")!;

        // Update payment status and transition to CONFIRMED
        await dataBase.updateRow({
          databaseId,
          tableId: "order",
          rowId: orderId,
          data: {
            paymentStatus: "PAID",
            stripeSessionId: session.id,
            currentStatus: "CONFIRMED",
          },
        });

        // Notify via WebSocket
        this.orderGateway.notifyOrderUpdate(
          orderId,
          "order:status-changed",
          {
            orderId,
            previousStatus: "PENDING",
            newStatus: "CONFIRMED",
            timestamp: new Date().toISOString(),
          },
        );

        const restaurantId = session.metadata?.restaurantId;
        if (restaurantId) {
          this.orderGateway.notifyRestaurant(
            restaurantId,
            "order:new",
            { orderId },
          );
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as any;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        const dataBase = this.databaseService.getDatabase();
        const databaseId = this.configService.get<string>("DATABASE_ID")!;

        await dataBase.updateRow({
          databaseId,
          tableId: "order",
          rowId: orderId,
          data: { paymentStatus: "FAILED" },
        });
      }
    }

    return { received: true };
  }
}

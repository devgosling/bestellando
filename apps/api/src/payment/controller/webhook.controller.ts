import {
  Controller,
  Post,
  Headers,
  HttpCode,
  Inject,
  forwardRef,
  Req,
  Logger,
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
  private readonly logger = new Logger(WebhookController.name);

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
    if (!req.rawBody) {
      this.logger.error(
        "Stripe webhook received but req.rawBody is empty — check that NestFactory.create has rawBody:true",
      );
      return { received: false };
    }
    if (!signature) {
      this.logger.warn("Stripe webhook missing stripe-signature header");
      return { received: false };
    }

    let event: ReturnType<StripeService["constructWebhookEvent"]>;
    try {
      event = this.stripeService.constructWebhookEvent(
        req.rawBody,
        signature,
      );
    } catch (err: any) {
      this.logger.error(
        `Stripe signature verification failed: ${err?.message ?? err}. STRIPE_WEBHOOK_SECRET likely doesn't match the secret printed by 'stripe listen'.`,
      );
      return { received: false };
    }

    this.logger.log(`Stripe event received: ${event.type} (${event.id})`);

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const orderId = session.metadata?.orderId;
        if (!orderId) {
          this.logger.warn(
            "checkout.session.completed missing metadata.orderId",
          );
          return { received: true };
        }
        const dataBase = this.databaseService.getDatabase();
        const databaseId = this.configService.get<string>("DATABASE_ID")!;

        await dataBase.updateRow({
          databaseId,
          tableId: "order",
          rowId: orderId,
          data: { currentStatus: "CONFIRMED" },
        });

        await dataBase
          .createRow({
            databaseId,
            tableId: "order_status_history",
            rowId: "unique()",
            data: { order: orderId, status: "CONFIRMED" },
          })
          .catch((e: any) =>
            this.logger.warn(
              `Failed to write status history for ${orderId}: ${e?.message ?? e}`,
            ),
          );

        this.orderGateway.notifyOrderUpdate(orderId, "order:status-changed", {
          orderId,
          previousStatus: "PENDING",
          newStatus: "CONFIRMED",
          timestamp: new Date().toISOString(),
        });

        const restaurantId = session.metadata?.restaurantId;
        if (restaurantId) {
          this.orderGateway.notifyRestaurant(restaurantId, "order:new", {
            orderId,
          });
        }
        this.logger.log(`Order ${orderId} → CONFIRMED via Stripe webhook`);
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
            data: { currentStatus: "CANCELLED" },
          });
          this.logger.log(`Order ${orderId} → CANCELLED via Stripe webhook`);
        }
      }
    } catch (err: any) {
      this.logger.error(
        `Webhook handler threw for event ${event.type}: ${err?.message ?? err}`,
      );
      return { received: false };
    }

    return { received: true };
  }
}

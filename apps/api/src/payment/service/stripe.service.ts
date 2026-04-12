import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

type StripeClient = InstanceType<typeof Stripe>;

@Injectable()
export class StripeService {
  private readonly stripe: StripeClient;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>("STRIPE_SECRET_KEY")!,
    );
  }

  async createCheckoutSession(params: {
    orderId: string;
    restaurantId: string;
    amount: number; // in cents
    customerEmail?: string;
    lineItems: { name: string; quantity: number; unitAmount: number }[];
  }) {
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") ||
      "http://localhost:5173";

    return this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: params.lineItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: item.unitAmount, // in cents
        },
        quantity: item.quantity,
      })),
      metadata: { orderId: params.orderId, restaurantId: params.restaurantId },
      customer_email: params.customerEmail,
      success_url: `${frontendUrl}/orders/${params.orderId}?payment=success`,
      cancel_url: `${frontendUrl}/orders/${params.orderId}?payment=cancelled`,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string) {
    const webhookSecret = this.configService.get<string>(
      "STRIPE_WEBHOOK_SECRET",
    )!;
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}

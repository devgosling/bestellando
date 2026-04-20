import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { Account, Query, Users } from "node-appwrite";

@WebSocketGateway({
  namespace: "/orders",
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://localhost:5173",
    ],
    credentials: true,
  },
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const appwriteClient = this.appwriteService.createUserClient(token);
      const account = new Account(appwriteClient);
      const user = await account.get();

      client.data.userId = user.$id;
      client.join(`user:${user.$id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // Cleanup if needed
  }

  @SubscribeMessage("subscribe:order")
  async handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { event: "error", data: { message: "Not authenticated" } };

    // Verify the user has access to this order (is the customer, restaurant owner, or delivery person)
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const dataBase = this.databaseService.getDatabase();
    try {
      const order = await dataBase.getRow({
        databaseId,
        tableId: "order",
        rowId: data.orderId,
      });
      if (!order) return { event: "error", data: { message: "Order not found" } };

      const customerRel = order.customer as { $id?: string } | string | undefined;
      const customerId = typeof customerRel === "object" ? customerRel?.$id : customerRel;
      const isCustomer = customerId === userId;
      const isDeliveryPerson = order.deliveryPersonId === userId;

      // Check restaurant ownership via team memberships
      let isRestaurantOwner = false;
      if (!isCustomer && !isDeliveryPerson) {
        const users = new Users(this.appwriteService.getSDKClient());
        const { memberships } = await users.listMemberships({ userId });
        const teamIds = memberships.map((m) => m.teamId);

        const restaurant = await dataBase.getRow({
          databaseId,
          tableId: "restaurant",
          rowId: order.restaurant,
        });
        if (restaurant) {
          const perms = JSON.stringify(restaurant.$permissions || []);
          isRestaurantOwner = teamIds.some((id) => perms.includes(`team:${id}`));
        }
      }

      if (!isCustomer && !isRestaurantOwner && !isDeliveryPerson) {
        return { event: "error", data: { message: "Access denied" } };
      }
    } catch {
      return { event: "error", data: { message: "Verification failed" } };
    }

    client.join(`order:${data.orderId}`);
    return { event: "subscribed", data: { room: `order:${data.orderId}` } };
  }

  @SubscribeMessage("subscribe:restaurant")
  async handleSubscribeRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return { event: "error", data: { message: "Not authenticated" } };

    // Verify user owns this restaurant via team memberships
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const dataBase = this.databaseService.getDatabase();
    try {
      const users = new Users(this.appwriteService.getSDKClient());
      const { memberships } = await users.listMemberships({ userId });
      const teamIds = memberships.map((m) => m.teamId);

      const restaurant = await dataBase.getRow({
        databaseId,
        tableId: "restaurant",
        rowId: data.restaurantId,
      });
      if (!restaurant) return { event: "error", data: { message: "Restaurant not found" } };

      const perms = JSON.stringify(restaurant.$permissions || []);
      const ownsRestaurant = teamIds.some((id) => perms.includes(`team:${id}`));
      if (!ownsRestaurant) {
        return { event: "error", data: { message: "Access denied" } };
      }
    } catch {
      return { event: "error", data: { message: "Verification failed" } };
    }

    client.join(`restaurant:${data.restaurantId}:orders`);
    return {
      event: "subscribed",
      data: { room: `restaurant:${data.restaurantId}:orders` },
    };
  }

  // Called by OrderService/PaymentService to notify
  notifyOrderUpdate(orderId: string, event: string, data: any) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  notifyRestaurant(restaurantId: string, event: string, data: any) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit(event, data);
  }
}

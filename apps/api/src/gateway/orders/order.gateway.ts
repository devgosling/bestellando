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
import { Account } from "node-appwrite";

@WebSocketGateway({
  namespace: "/orders",
  cors: { origin: "*" },
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly appwriteService: AppwriteService) {}

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
  handleSubscribeOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    // TODO: verify ownership before joining
    client.join(`order:${data.orderId}`);
    return { event: "subscribed", data: { room: `order:${data.orderId}` } };
  }

  @SubscribeMessage("subscribe:restaurant")
  handleSubscribeRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    // TODO: verify restaurant ownership
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

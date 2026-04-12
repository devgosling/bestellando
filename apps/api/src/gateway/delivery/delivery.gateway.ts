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
import { GpsStoreService } from "./gps-store.service";

@WebSocketGateway({
  namespace: "/delivery",
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://localhost:5173",
    ],
    credentials: true,
  },
})
export class DeliveryGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly gpsStore: GpsStoreService,
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

  handleDisconnect(client: Socket) {
    // Remove from available drivers room
    client.leave("delivery:available");
  }

  @SubscribeMessage("driver:location")
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      orderId: string;
      lat: number;
      lng: number;
      heading: number;
      speed: number;
    },
  ) {
    const position = {
      ...data,
      timestamp: Date.now(),
      driverId: client.data.userId,
    };
    this.gpsStore.update(data.orderId, position);
    this.server
      .to(`delivery:${data.orderId}:gps`)
      .emit("delivery:gps-position", position);
  }

  @SubscribeMessage("subscribe:delivery-tracking")
  handleSubscribeTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.join(`delivery:${data.orderId}:gps`);

    // Send last known position if available
    const lastPosition = this.gpsStore.get(data.orderId);
    if (lastPosition) {
      client.emit("delivery:gps-position", lastPosition);
    }

    return {
      event: "subscribed",
      data: { room: `delivery:${data.orderId}:gps` },
    };
  }

  @SubscribeMessage("driver:go-online")
  handleDriverOnline(@ConnectedSocket() client: Socket) {
    client.join("delivery:available");
    return { event: "online" };
  }

  @SubscribeMessage("driver:go-offline")
  handleDriverOffline(@ConnectedSocket() client: Socket) {
    client.leave("delivery:available");
    return { event: "offline" };
  }

  // Called by DeliveryService to broadcast available orders
  notifyAvailableDelivery(data: any) {
    this.server.to("delivery:available").emit("delivery:available-order", data);
  }

  notifyDeliveryTaken(orderId: string) {
    this.server
      .to("delivery:available")
      .emit("delivery:order-taken", { orderId });
  }

  notifyDeliveryAssigned(orderId: string, data: any) {
    this.server.to(`order:${orderId}`).emit("delivery:assigned", data);
  }
}

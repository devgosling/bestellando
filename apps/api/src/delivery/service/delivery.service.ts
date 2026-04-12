import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { DeliveryGateway } from "../../gateway/delivery/delivery.gateway";
import { ID, Query, TablesDB } from "node-appwrite";

@Injectable()
export class DeliveryService {
  private readonly dataBase: TablesDB;

  // In-memory map for atomic acceptance (orderId -> deliveryPersonId)
  private readonly acceptedOrders = new Map<string, string>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly actorContextService: ActorContextService,
    @Inject(forwardRef(() => DeliveryGateway))
    private readonly deliveryGateway: DeliveryGateway,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async getAvailableDeliveries() {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    // List orders with status "READY" that don't have a delivery assignment
    const orders = await this.dataBase.listRows({
      databaseId,
      tableId: "order",
      queries: [Query.equal("currentStatus", "READY")],
    });

    // Filter out orders that already have deliveries
    const deliveries = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery",
      queries: [Query.notEqual("status", "DELIVERED")],
    });
    const assignedOrderIds = new Set(
      deliveries.rows.map((d: any) => d.order),
    );

    return {
      data: orders.rows.filter(
        (o: any) => !assignedOrderIds.has(o.$id),
      ),
    };
  }

  async acceptDelivery(orderId: string) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    // Atomic check: has this order already been accepted?
    if (this.acceptedOrders.has(orderId)) {
      throw new BadRequestException(
        "This delivery has already been accepted",
      );
    }
    this.acceptedOrders.set(orderId, userId); // Reserve it

    try {
      // Get delivery person profile
      const dpResult = await this.dataBase.listRows({
        databaseId,
        tableId: "deliveryPerson",
        queries: [Query.equal("userId", userId), Query.limit(1)],
      });
      if (dpResult.total === 0) {
        throw new BadRequestException(
          "Not registered as delivery person",
        );
      }
      const deliveryPerson = dpResult.rows[0];

      // Verify the order exists and is READY
      const order = await this.dataBase.getRow({
        databaseId,
        tableId: "order",
        rowId: orderId,
      });
      if (!order) {
        throw new NotFoundException("Order not found");
      }
      if (order.currentStatus !== "READY") {
        throw new BadRequestException(
          "Order is not ready for delivery",
        );
      }

      // Create delivery record
      const delivery = await this.dataBase.createRow({
        databaseId,
        tableId: "delivery",
        rowId: ID.unique(),
        data: {
          order: orderId,
          deliveryPerson: deliveryPerson.$id,
          status: "ASSIGNED",
          assignedAt: new Date().toISOString(),
        },
      });

      // Update order with deliveryPersonId
      await this.dataBase.updateRow({
        databaseId,
        tableId: "order",
        rowId: orderId,
        data: { deliveryPersonId: deliveryPerson.$id },
      });

      // Notify via WebSocket
      this.deliveryGateway.notifyDeliveryTaken(orderId);
      this.deliveryGateway.notifyDeliveryAssigned(orderId, {
        driverId: deliveryPerson.$id,
        driverName: deliveryPerson.name,
        estimatedMinutes: 15,
      });

      return delivery;
    } catch (error) {
      this.acceptedOrders.delete(orderId); // Release on failure
      throw error;
    }
  }

  async markPickedUp(deliveryId: string) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const delivery = await this.dataBase.getRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
    });
    if (!delivery) {
      throw new NotFoundException("Delivery not found");
    }

    // Verify the delivery person owns this delivery
    const dpResult = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (dpResult.total === 0 || dpResult.rows[0].$id !== delivery.deliveryPerson) {
      throw new BadRequestException("This delivery is not assigned to you");
    }

    if (delivery.status !== "ASSIGNED") {
      throw new BadRequestException(
        "Delivery must be in ASSIGNED status to mark as picked up",
      );
    }

    await this.dataBase.updateRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
      data: { status: "PICKED_UP", pickedUpAt: new Date().toISOString() },
    });

    // Also transition order status
    await this.dataBase.updateRow({
      databaseId,
      tableId: "order",
      rowId: delivery.order,
      data: { currentStatus: "PICKED_UP" },
    });

    return { success: true };
  }

  async markDelivered(deliveryId: string) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const delivery = await this.dataBase.getRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
    });
    if (!delivery) {
      throw new NotFoundException("Delivery not found");
    }

    // Verify the delivery person owns this delivery
    const dpResult = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (dpResult.total === 0 || dpResult.rows[0].$id !== delivery.deliveryPerson) {
      throw new BadRequestException("This delivery is not assigned to you");
    }

    if (delivery.status !== "PICKED_UP") {
      throw new BadRequestException(
        "Delivery must be in PICKED_UP status to mark as delivered",
      );
    }

    await this.dataBase.updateRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
      data: { status: "DELIVERED", deliveredAt: new Date().toISOString() },
    });

    await this.dataBase.updateRow({
      databaseId,
      tableId: "order",
      rowId: delivery.order,
      data: { currentStatus: "DELIVERED" },
    });

    // Clean up atomic acceptance map
    this.acceptedOrders.delete(delivery.order);

    return { success: true };
  }

  async getDeliveryByOrderId(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery",
      queries: [Query.equal("order", orderId), Query.limit(1)],
    });
    if (result.total === 0) {
      throw new NotFoundException("Delivery not found for this order");
    }

    return result.rows[0];
  }

  async getMyDeliveries(page = 1, limit = 25) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const offset = (page - 1) * limit;

    // First get the delivery person profile
    const dpResult = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (dpResult.total === 0) {
      throw new BadRequestException("Not registered as delivery person");
    }

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery",
      queries: [
        Query.equal("deliveryPerson", dpResult.rows[0].$id),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
        Query.offset(offset),
      ],
    });

    return {
      data: result.rows,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }
}

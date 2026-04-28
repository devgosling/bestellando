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
import { OrderGateway } from "../../gateway/orders/order.gateway";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { ID, Query, Storage, TablesDB } from "node-appwrite";

const PROOF_BUCKET_ID = "delivery_proof";

@Injectable()
export class DeliveryService {
  private readonly dataBase: TablesDB;
  private readonly storage: Storage;

  // In-memory map for atomic acceptance (orderId -> deliveryPersonId)
  private readonly acceptedOrders = new Map<string, string>();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly actorContextService: ActorContextService,
    private readonly appwriteService: AppwriteService,
    @Inject(forwardRef(() => DeliveryGateway))
    private readonly deliveryGateway: DeliveryGateway,
    @Inject(forwardRef(() => OrderGateway))
    private readonly orderGateway: OrderGateway,
  ) {
    this.dataBase = this.databaseService.getDatabase();
    this.storage = new Storage(this.appwriteService.getSDKClient());
  }

  async getAvailableDeliveries() {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const orders = await this.dataBase.listRows({
      databaseId,
      tableId: "order",
      queries: [Query.equal("currentStatus", "READY")],
    });

    const deliveries = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery",
      queries: [Query.notEqual("status", "DELIVERED")],
    });
    const assignedOrderIds = new Set(
      deliveries.rows.map((d: any) =>
        typeof d.order === "object" ? d.order?.$id : d.order,
      ),
    );

    const available = orders.rows.filter(
      (o: any) => !assignedOrderIds.has(o.$id),
    );

    const enriched = await Promise.all(
      available.map(async (o: any) => {
        let restaurant: any = o.restaurant;
        if (typeof restaurant === "string") {
          restaurant = await this.dataBase
            .getRow({ databaseId, tableId: "restaurant", rowId: restaurant })
            .catch(() => null);
        }
        let pickupAddress: any =
          restaurant && typeof restaurant === "object"
            ? restaurant.address
            : null;
        if (typeof pickupAddress === "string") {
          pickupAddress = await this.dataBase
            .getRow({ databaseId, tableId: "address", rowId: pickupAddress })
            .catch(() => null);
        }
        let deliveryAddress: any = o.deliveryAddress;
        if (typeof deliveryAddress === "string") {
          deliveryAddress = await this.dataBase
            .getRow({ databaseId, tableId: "address", rowId: deliveryAddress })
            .catch(() => null);
        }

        if (!pickupAddress || !deliveryAddress) return null;

        return {
          orderId: o.$id,
          restaurantName: restaurant?.name ?? "Restaurant",
          pickupAddress,
          deliveryAddress,
        };
      }),
    );

    return { data: enriched.filter((d) => d !== null) };
  }

  async notifyOrderReady(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const order = await this.dataBase
      .getRow({ databaseId, tableId: "order", rowId: orderId })
      .catch(() => null);
    if (!order) return;

    let restaurant: any = order.restaurant;
    if (typeof restaurant === "string") {
      restaurant = await this.dataBase
        .getRow({ databaseId, tableId: "restaurant", rowId: restaurant })
        .catch(() => null);
    }
    let pickupAddress: any =
      restaurant && typeof restaurant === "object" ? restaurant.address : null;
    if (typeof pickupAddress === "string") {
      pickupAddress = await this.dataBase
        .getRow({ databaseId, tableId: "address", rowId: pickupAddress })
        .catch(() => null);
    }
    let deliveryAddress: any = order.deliveryAddress;
    if (typeof deliveryAddress === "string") {
      deliveryAddress = await this.dataBase
        .getRow({ databaseId, tableId: "address", rowId: deliveryAddress })
        .catch(() => null);
    }

    if (!pickupAddress || !deliveryAddress) return;

    this.deliveryGateway.notifyAvailableDelivery({
      orderId,
      restaurantName: restaurant?.name ?? "Restaurant",
      pickupAddress,
      deliveryAddress,
    });
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
        tableId: "delivery_person",
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

      const assignedPayload = {
        orderId,
        driverId: deliveryPerson.$id,
        driverName: deliveryPerson.name,
        driverPhone: deliveryPerson.phone,
        vehicleType: deliveryPerson.vehicleType,
        estimatedMinutes: 15,
      };

      // Notify via WebSocket
      this.deliveryGateway.notifyDeliveryTaken(orderId);
      this.orderGateway.notifyOrderUpdate(
        orderId,
        "delivery:assigned",
        assignedPayload,
      );

      const restaurantId =
        typeof order.restaurant === "object"
          ? order.restaurant?.$id
          : order.restaurant;
      if (restaurantId) {
        this.orderGateway.notifyRestaurant(
          restaurantId,
          "delivery:assigned",
          assignedPayload,
        );
      }

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
      tableId: "delivery_person",
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

  async markDelivered(deliveryId: string, proofImageId: string) {
    if (!proofImageId) {
      throw new BadRequestException(
        "A proof-of-delivery image is required",
      );
    }
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
      tableId: "delivery_person",
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
      data: {
        status: "DELIVERED",
        deliveredAt: new Date().toISOString(),
        proofImageId,
      },
    });

    await this.dataBase.updateRow({
      databaseId,
      tableId: "order",
      rowId: delivery.order,
      data: { currentStatus: "DELIVERED" },
    });

    // Clean up atomic acceptance map
    this.acceptedOrders.delete(delivery.order);

    return { success: true, proofImageId };
  }

  async uploadProofImage(
    deliveryId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ) {
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

    const dpResult = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery_person",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (
      dpResult.total === 0 ||
      dpResult.rows[0].$id !== delivery.deliveryPerson
    ) {
      throw new BadRequestException("This delivery is not assigned to you");
    }

    const fileBlob = new File(
      [new Uint8Array(file.buffer)],
      file.originalname,
      { type: file.mimetype },
    );
    const created = await this.storage.createFile({
      bucketId: PROOF_BUCKET_ID,
      fileId: ID.unique(),
      file: fileBlob,
    });

    return { fileId: created.$id };
  }

  async getProofImage(deliveryId: string) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const delivery = await this.dataBase.getRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
    });
    if (!delivery || !delivery.proofImageId) {
      throw new NotFoundException("Proof image not found");
    }

    const order = await this.dataBase
      .getRow({ databaseId, tableId: "order", rowId: delivery.order })
      .catch(() => null);
    const restaurant: any =
      order && typeof order.restaurant === "object"
        ? order.restaurant
        : order?.restaurant
          ? await this.dataBase
              .getRow({
                databaseId,
                tableId: "restaurant",
                rowId: order.restaurant,
              })
              .catch(() => null)
          : null;
    const dpRow = await this.dataBase
      .getRow({
        databaseId,
        tableId: "delivery_person",
        rowId: delivery.deliveryPerson,
      })
      .catch(() => null);

    const isCustomer = order?.customer === userId;
    const isRestaurantOwner = restaurant?.ownerId === userId;
    const isDriver = dpRow?.userId === userId;
    if (!isCustomer && !isRestaurantOwner && !isDriver) {
      throw new BadRequestException("Not authorized to view this proof");
    }

    const buffer = (await this.storage.getFileDownload({
      bucketId: PROOF_BUCKET_ID,
      fileId: delivery.proofImageId as string,
    })) as Buffer | ArrayBuffer;

    return {
      buffer: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
      fileId: delivery.proofImageId as string,
    };
  }

  async getDeliveryById(deliveryId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const delivery = await this.dataBase.getRow({
      databaseId,
      tableId: "delivery",
      rowId: deliveryId,
    });
    if (!delivery) {
      throw new NotFoundException("Delivery not found");
    }
    return delivery;
  }

  async getDeliveryByOrderId(orderId: string) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const order = await this.dataBase
      .getRow({ databaseId, tableId: "order", rowId: orderId })
      .catch(() => null);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    const restaurant: any =
      typeof order.restaurant === "object"
        ? order.restaurant
        : order.restaurant
          ? await this.dataBase
              .getRow({
                databaseId,
                tableId: "restaurant",
                rowId: order.restaurant,
              })
              .catch(() => null)
          : null;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery",
      queries: [Query.equal("order", orderId), Query.limit(1)],
    });
    if (result.total === 0) {
      return null;
    }
    const delivery: any = result.rows[0];

    let deliveryPerson: any =
      typeof delivery.deliveryPerson === "object"
        ? delivery.deliveryPerson
        : delivery.deliveryPerson
          ? await this.dataBase
              .getRow({
                databaseId,
                tableId: "delivery_person",
                rowId: delivery.deliveryPerson,
              })
              .catch(() => null)
          : null;

    const isCustomer = order.customer === userId;
    const isRestaurantOwner = restaurant?.ownerId === userId;
    const isAssignedDriver = deliveryPerson?.userId === userId;
    if (!isCustomer && !isRestaurantOwner && !isAssignedDriver) {
      throw new BadRequestException("Not authorized to view this delivery");
    }

    return { ...delivery, deliveryPerson };
  }

  async getMyDeliveries(page = 1, limit = 25) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const offset = (page - 1) * limit;

    // First get the delivery person profile
    const dpResult = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery_person",
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

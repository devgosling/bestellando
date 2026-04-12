import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { UserService } from "../../user/service/user.service";
import { OrderItemService } from "../../orderItem/service/order-item.service";
import { OrderStatusHistoryService } from "../../orderStatusHistory/service/order-status-history.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderStatusDto } from "../dto/update-order-status.dto";
import { validateTransition } from "./order-state-machine";
import { type OrderStatus } from "@repo/interfaces";
import { ID, Query, TablesDB } from "node-appwrite";

@Injectable()
export class OrderService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly actorContextService: ActorContextService,
    private readonly userService: UserService,
    private readonly orderItemService: OrderItemService,
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async createOrder(dto: CreateOrderDto) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    // 1. Validate restaurant exists and is active
    const restaurant = await this.dataBase.getRow({
      databaseId,
      tableId: "restaurant",
      rowId: dto.restaurantId,
    });
    if (!restaurant || !restaurant.isActive) {
      throw new BadRequestException("Restaurant not found or inactive");
    }

    // 2. Validate all products belong to restaurant and are available
    const products: { product: Record<string, unknown>; quantity: number }[] =
      [];
    for (const item of dto.items) {
      const product = await this.dataBase.getRow({
        databaseId,
        tableId: "product",
        rowId: item.productId,
      });
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      if (!product.isAvailable) {
        throw new BadRequestException(
          `Product ${product.name} is not available`,
        );
      }
      products.push({ product, quantity: item.quantity });
    }

    // 3. Calculate subtotal server-side
    const subtotal = products.reduce(
      (sum, { product, quantity }) =>
        sum + (product.basePrice as number) * quantity,
      0,
    );

    // 4. Validate minimum order value
    const minOrderValue = (restaurant.minOrderValue as number) || 0;
    if (subtotal < minOrderValue) {
      throw new BadRequestException(
        `Minimum order value is ${minOrderValue}`,
      );
    }

    // 5. Calculate total
    const deliveryFee = (restaurant.deliveryFee as number) || 0;
    const totalAmount = subtotal + deliveryFee;

    // 6. Create order
    const order = await this.dataBase.createRow({
      databaseId,
      tableId: "order",
      rowId: ID.unique(),
      data: {
        restaurant: dto.restaurantId,
        deliveryAddress: dto.deliveryAddressId,
        currentStatus: "PENDING",
        subtotal,
        deliveryFee,
        totalAmount,
        specialInstructions: dto.specialInstructions || "",
        customerId: userId,
        paymentStatus: "UNPAID",
        createdAt: new Date().toISOString(),
      },
    });

    // 7. Create order items with price snapshots
    for (const { product, quantity } of products) {
      const unitPrice = product.basePrice as number;
      await this.orderItemService.createOrderItem({
        order: order.$id,
        product: product.$id as string,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      });
    }

    // 8. Create initial status history
    await this.orderStatusHistoryService.createOrderStatusHistory({
      order: order.$id,
      status: "PENDING",
      changedBy: userId,
      changedAt: new Date().toISOString(),
    });

    return order;
  }

  async transitionStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const userId = this.actorContextService.get().user.id;
    const userType = await this.userService.getUserType();
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const order = await this.dataBase.getRow({
      databaseId,
      tableId: "order",
      rowId: orderId,
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Validate transition using state machine
    validateTransition(
      order.currentStatus as OrderStatus,
      dto.status,
      userType || "CUSTOMER",
    );

    // Update order status
    await this.dataBase.updateRow({
      databaseId,
      tableId: "order",
      rowId: orderId,
      data: { currentStatus: dto.status },
    });

    // Create status history entry
    await this.orderStatusHistoryService.createOrderStatusHistory({
      order: orderId,
      status: dto.status,
      changedBy: userId,
      changedAt: new Date().toISOString(),
    });

    return { success: true, status: dto.status };
  }

  async getMyOrders(page = 1, limit = 25) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const offset = (page - 1) * limit;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "order",
      queries: [
        Query.equal("customerId", userId),
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

  async getOrderById(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const order = await this.dataBase.getRow({
      databaseId,
      tableId: "order",
      rowId: orderId,
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return order;
  }

  async getOrderItems(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.listRows({
      databaseId,
      tableId: "orderItem",
      queries: [Query.equal("order", orderId)],
    });
  }

  async getStatusHistory(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.listRows({
      databaseId,
      tableId: "orderStatusHistory",
      queries: [
        Query.equal("order", orderId),
        Query.orderAsc("changedAt"),
      ],
    });
  }
}

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
import { UserService } from "../../user/service/user.service";
import { OrderItemService } from "../../orderItem/service/order-item.service";
import { ModifierOptionService } from "../../modifierOption/service/modifier-option.service";
import { OrderStatusHistoryService } from "../../orderStatusHistory/service/order-status-history.service";
import { OrderGateway } from "../../gateway/orders/order.gateway";
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
    private readonly modifierOptionService: ModifierOptionService,
    private readonly orderStatusHistoryService: OrderStatusHistoryService,
    @Inject(forwardRef(() => OrderGateway))
    private readonly orderGateway: OrderGateway,
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
    const products: {
      product: Record<string, unknown>;
      quantity: number;
      resolvedModifiers: { $id: string; priceDelta: number }[];
      specialInstructions?: string;
      unitPrice: number;
    }[] = [];
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

      const resolvedModifiers: { $id: string; priceDelta: number }[] = [];
      for (const modifierOptionId of item.modifierOptionIds ?? []) {
        const option = await this.modifierOptionService.getById(modifierOptionId);
        const optionProductId =
          typeof option.product === "string"
            ? option.product
            : (option.product as { $id?: string } | undefined)?.$id;
        if (optionProductId !== item.productId) {
          throw new BadRequestException(
            `Modifier option ${modifierOptionId} does not belong to product ${item.productId}`,
          );
        }
        if (option.isAvailable === false) {
          throw new BadRequestException(
            `Modifier option "${option.name}" is not available`,
          );
        }
        resolvedModifiers.push({
          $id: option.$id,
          priceDelta: option.priceDelta as number,
        });
      }

      const modifierTotal = resolvedModifiers.reduce(
        (sum, m) => sum + m.priceDelta,
        0,
      );
      const unitPrice = (product.basePrice as number) + modifierTotal;

      products.push({
        product,
        quantity: item.quantity,
        resolvedModifiers,
        specialInstructions: item.specialInstructions,
        unitPrice,
      });
    }

    // 3. Calculate subtotal server-side (modifier prices included)
    const subtotal = products.reduce(
      (sum, { unitPrice, quantity }) => sum + unitPrice * quantity,
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
        customer: userId,
      },
    });

    // 7. Create order items with price snapshots + linked modifier rows
    for (const {
      product,
      quantity,
      unitPrice,
      resolvedModifiers,
      specialInstructions,
    } of products) {
      const orderItem = await this.orderItemService.createOrderItem({
        order: order.$id,
        product: product.$id as string,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        specialInstructions,
      });

      for (const mod of resolvedModifiers) {
        await this.dataBase.createRow({
          databaseId,
          tableId: "order_item_modifier",
          rowId: ID.unique(),
          data: {
            orderItem: orderItem.$id,
            modifierOption: mod.$id,
            deltaPrice: mod.priceDelta,
          },
        });
      }
    }

    // 8. Create initial status history
    await this.orderStatusHistoryService.createOrderStatusHistory({
      order: order.$id,
      status: "PENDING",
    });

    // 9. Notify restaurant of new order via WebSocket
    this.orderGateway.notifyRestaurant(dto.restaurantId, "order:new", {
      order,
      items: products.map(({ product, quantity }) => ({
        productId: product.$id,
        quantity,
      })),
    });

    return order;
  }

  async transitionStatus(orderId: string, dto: UpdateOrderStatusDto) {
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
    });

    // Notify subscribers of status change via WebSocket
    this.orderGateway.notifyOrderUpdate(orderId, "order:status-changed", {
      orderId,
      previousStatus: order.currentStatus,
      newStatus: dto.status,
      timestamp: new Date().toISOString(),
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
        Query.equal("customer", userId),
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

  async getOrderById(orderId: string, enforceOwnership = true) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const order = await this.dataBase.getRow({
      databaseId,
      tableId: "order",
      rowId: orderId,
    });
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (enforceOwnership) {
      const userId = this.actorContextService.get().user.id;
      const userType = await this.userService.getUserType();

      if (userType === "CUSTOMER" && order.customer !== userId) {
        throw new NotFoundException("Order not found");
      }

      if (userType === "RESTAURANT") {
        // Verify restaurant ownership by checking the user's teams
        const restaurantResult =
          await this.dataBase.getRow({
            databaseId,
            tableId: "restaurant",
            rowId: order.restaurant,
          });
        if (!restaurantResult) {
          throw new NotFoundException("Order not found");
        }
      }
    }

    return order;
  }

  async getRestaurantOrders(restaurantId: string, limit = 25) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "order",
      queries: [
        Query.equal("restaurant", restaurantId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ],
    });

    return { data: result.rows, total: result.total };
  }

  async getOrderItems(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.listRows({
      databaseId,
      tableId: "order_item",
      queries: [Query.equal("order", orderId)],
    });
  }

  async getStatusHistory(orderId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.listRows({
      databaseId,
      tableId: "order_status_history",
      queries: [
        Query.equal("order", orderId),
        Query.orderAsc("$createdAt"),
      ],
    });
  }
}

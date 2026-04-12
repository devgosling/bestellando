import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { OrderEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrderService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async createOrder(order: OrderEntity) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "order",
      rowId: ID.unique(),
      data: order as object as Record<string, unknown>,
      permissions: [Permission.read(Role.any())],
    });
  }

  async getOrderById(id: string, userId?: string) {
    const order = await this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "order",
      rowId: id,
    });

    if (
      userId &&
      order &&
      (order as unknown as Record<string, unknown>).customerId !== userId
    ) {
      return null;
    }

    return order;
  }

  async getAllOrders(userId?: string) {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "order",
      ...(userId
        ? { queries: [Query.equal("customerId", userId)] }
        : {}),
    });
  }

  async updateOrder(id: string, patch: Partial<OrderEntity>) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "order",
      rowId: id,
      data: patch as object as Record<string, unknown>,
    });
  }

  async deleteOrder(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "order",
      rowId: id,
    });
  }
}

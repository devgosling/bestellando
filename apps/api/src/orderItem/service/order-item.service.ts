import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { OrderItemEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrderItemService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async createOrderItem(entity: OrderItemEntity) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderItem",
      rowId: ID.unique(),
      data: entity as object as Record<string, unknown>,
      permissions: [Permission.read(Role.any())],
    });
  }

  async getOrderItemById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderItem",
      rowId: id,
    });
  }

  async getAllOrderItems() {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderItem",
    });
  }

  async updateOrderItem(id: string, patch: Partial<OrderItemEntity>) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderItem",
      rowId: id,
      data: patch as object as Record<string, unknown>,
    });
  }

  async deleteOrderItem(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderItem",
      rowId: id,
    });
  }
}

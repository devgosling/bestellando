import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { OrderStatusHistoryEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OrderStatusHistoryService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async createOrderStatusHistory(entity: OrderStatusHistoryEntity) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderStatusHistory",
      rowId: ID.unique(),
      data: entity as object as Record<string, unknown>,
      permissions: [Permission.read(Role.any())],
    });
  }

  async getOrderStatusHistoryById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderStatusHistory",
      rowId: id,
    });
  }

  async getAllOrderStatusHistories() {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderStatusHistory",
    });
  }

  async updateOrderStatusHistory(
    id: string,
    patch: Partial<OrderStatusHistoryEntity>,
  ) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderStatusHistory",
      rowId: id,
      data: patch as object as Record<string, unknown>,
    });
  }

  async deleteOrderStatusHistory(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "orderStatusHistory",
      rowId: id,
    });
  }
}

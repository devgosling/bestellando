import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ID, TablesDB } from "node-appwrite";

@Injectable()
export class OrderStatusHistoryService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  public async createOrderStatusHistory(data: {
    order: string;
    status: string;
    changedBy: string;
    changedAt: string;
  }) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.createRow({
      databaseId,
      tableId: "orderStatusHistory",
      rowId: ID.unique(),
      data: data as Record<string, unknown>,
    });
  }
}

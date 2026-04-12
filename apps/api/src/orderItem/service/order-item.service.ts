import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ID, TablesDB } from "node-appwrite";

@Injectable()
export class OrderItemService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  public async createOrderItem(data: {
    order: string;
    product: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    return this.dataBase.createRow({
      databaseId,
      tableId: "orderItem",
      rowId: ID.unique(),
      data: data as Record<string, unknown>,
    });
  }
}

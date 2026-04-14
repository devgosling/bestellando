import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { OpeningHoursEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OpeningHoursService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async createOpeningHours(entity: OpeningHoursEntity) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
      rowId: ID.unique(),
      data: entity as object as Record<string, unknown>,
      permissions: [Permission.read(Role.any())],
    });
  }

  async getOpeningHoursById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
      rowId: id,
    });
  }

  async getAllOpeningHours() {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
    });
  }

  async getByRestaurant(restaurantId: string) {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
      queries: [Query.equal("restaurant", restaurantId)],
    });
  }

  async updateOpeningHours(id: string, patch: Partial<OpeningHoursEntity>) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
      rowId: id,
      data: patch as object as Record<string, unknown>,
    });
  }

  async deleteOpeningHours(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "opening_hours",
      rowId: id,
    });
  }
}

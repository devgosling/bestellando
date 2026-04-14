import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { DeliveryZoneEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DeliveryZoneService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  private normalizeData(
    input: Record<string, unknown>,
  ): Record<string, unknown> {
    const { restaurantId, restaurant, ...rest } = input;
    const relation =
      restaurant ??
      (typeof restaurantId === "string" ? restaurantId : undefined);
    const data: Record<string, unknown> = { ...rest };
    if (relation !== undefined) data.restaurant = relation;
    return data;
  }

  async createDeliveryZone(
    entity: Partial<DeliveryZoneEntity> & { restaurantId?: string },
  ) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "delivery_zone",
      rowId: ID.unique(),
      data: this.normalizeData(entity as unknown as Record<string, unknown>),
      permissions: [Permission.read(Role.any())],
    });
  }

  async getDeliveryZoneById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "delivery_zone",
      rowId: id,
    });
  }

  async getAllDeliveryZones(restaurantId?: string) {
    const queries: string[] = [];
    if (restaurantId) {
      queries.push(Query.equal("restaurant", restaurantId));
    }
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "delivery_zone",
      queries,
    });
  }

  async updateDeliveryZone(
    id: string,
    patch: Partial<DeliveryZoneEntity> & { restaurantId?: string },
  ) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "delivery_zone",
      rowId: id,
      data: this.normalizeData(patch as unknown as Record<string, unknown>),
    });
  }

  async deleteDeliveryZone(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "delivery_zone",
      rowId: id,
    });
  }
}

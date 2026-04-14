import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ProductEntity } from "@repo/interfaces";
import { ID, Permission, Query, Role, TablesDB } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ProductService {
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
    if (data.imageUrl === "") data.imageUrl = null;
    return data;
  }

  async createProduct(product: ProductEntity & { restaurantId?: string }) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: ID.unique(),
      data: this.normalizeData(product as unknown as Record<string, unknown>),
      permissions: [Permission.read(Role.any())],
    });
  }

  async getProductById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: id,
    });
  }

  async getAllProducts(restaurantId?: string) {
    const queries: string[] = [];
    if (restaurantId) {
      queries.push(Query.equal("restaurant", restaurantId));
    }
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      queries,
    });
  }

  async updateProduct(
    id: string,
    patch: Partial<ProductEntity> & { restaurantId?: string },
  ) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: id,
      data: this.normalizeData(patch as unknown as Record<string, unknown>),
    });
  }

  async deleteProduct(id: string) {
    return this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: id,
    });
  }
}

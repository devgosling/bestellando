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

  async createProduct(product: ProductEntity) {
    return this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: ID.unique(),
      data: product as object as Record<string, unknown>,
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

  async getAllProducts() {
    return this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
    });
  }

  async updateProduct(id: string, patch: Partial<ProductEntity>) {
    return this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "product",
      rowId: id,
      data: patch as object as Record<string, unknown>,
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

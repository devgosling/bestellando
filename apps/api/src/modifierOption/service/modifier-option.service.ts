import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ID, Query, TablesDB } from "node-appwrite";
import { DatabaseService } from "../../database/service/database.service";
import {
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
} from "../dto/modifier-option.dto";

@Injectable()
export class ModifierOptionService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  private get databaseId() {
    return this.configService.get<string>("DATABASE_ID")!;
  }

  async create(dto: CreateModifierOptionDto) {
    return this.dataBase.createRow({
      databaseId: this.databaseId,
      tableId: "modifier_option",
      rowId: ID.unique(),
      data: {
        product: dto.product,
        name: dto.name,
        priceDelta: dto.priceDelta,
        isDefault: dto.isDefault ?? false,
        isAvailable: dto.isAvailable ?? true,
        type: dto.type ?? [],
      },
    });
  }

  async update(id: string, dto: UpdateModifierOptionDto) {
    return this.dataBase.updateRow({
      databaseId: this.databaseId,
      tableId: "modifier_option",
      rowId: id,
      data: dto as Record<string, unknown>,
    });
  }

  async delete(id: string) {
    await this.dataBase.deleteRow({
      databaseId: this.databaseId,
      tableId: "modifier_option",
      rowId: id,
    });
    return { success: true };
  }

  async getById(id: string) {
    const row = await this.dataBase.getRow({
      databaseId: this.databaseId,
      tableId: "modifier_option",
      rowId: id,
    });
    if (!row) throw new NotFoundException("Modifier option not found");
    return row;
  }

  async listByProduct(productId: string) {
    const result = await this.dataBase.listRows({
      databaseId: this.databaseId,
      tableId: "modifier_option",
      queries: [Query.equal("product", productId)],
    });
    return { data: result.rows, total: result.total };
  }
}

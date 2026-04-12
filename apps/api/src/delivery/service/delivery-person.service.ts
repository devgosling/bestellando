import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { ID, Query, TablesDB } from "node-appwrite";

@Injectable()
export class DeliveryPersonService {
  private readonly dataBase: TablesDB;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly actorContextService: ActorContextService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async register(data: { name: string; phone: string; vehicleType: string }) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    // Check if already registered
    const existing = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (existing.total > 0) {
      throw new BadRequestException("Already registered as delivery person");
    }

    return this.dataBase.createRow({
      databaseId,
      tableId: "deliveryPerson",
      rowId: ID.unique(),
      data: {
        userId,
        name: data.name,
        phone: data.phone,
        vehicleType: data.vehicleType,
        isAvailable: false,
      },
    });
  }

  async getProfile() {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (result.total === 0) {
      throw new NotFoundException("Delivery person profile not found");
    }

    return result.rows[0];
  }

  async toggleAvailability(isAvailable: boolean) {
    const userId = this.actorContextService.get().user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (result.total === 0) {
      throw new NotFoundException("Delivery person profile not found");
    }

    const deliveryPerson = result.rows[0];

    await this.dataBase.updateRow({
      databaseId,
      tableId: "deliveryPerson",
      rowId: deliveryPerson.$id,
      data: { isAvailable },
    });

    return { success: true, isAvailable };
  }

  async getDeliveryPersonByUserId(userId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "deliveryPerson",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (result.total === 0) {
      return null;
    }

    return result.rows[0];
  }
}

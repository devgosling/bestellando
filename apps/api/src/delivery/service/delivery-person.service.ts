import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { ConfigService } from "@nestjs/config";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { ID, Query, TablesDB, Teams, Users } from "node-appwrite";

const DELIVERY_PERSONS_TEAM_ID = "delivery_persons";

@Injectable()
export class DeliveryPersonService {
  private readonly dataBase: TablesDB;
  private readonly teams: Teams;
  private readonly users: Users;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly actorContextService: ActorContextService,
    private readonly appwriteService: AppwriteService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
    const sdk = this.appwriteService.getSDKClient();
    this.teams = new Teams(sdk);
    this.users = new Users(sdk);
  }

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
    vehicleType: string;
  }) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;
    const fullName = `${data.firstName} ${data.lastName}`.trim();

    let user;
    try {
      user = await this.users.create({
        userId: ID.unique(),
        email: data.email,
        password: data.password,
        name: fullName,
      });
    } catch (error: any) {
      if (error?.type === "user_already_exists") {
        throw new BadRequestException(
          "Ein Benutzer mit dieser E-Mail existiert bereits.",
        );
      }
      throw error;
    }

    try {
      await this.teams.create({
        teamId: DELIVERY_PERSONS_TEAM_ID,
        name: "Delivery Persons",
      });
    } catch (error: any) {
      if (error?.code !== 409) {
        throw error;
      }
    }

    await this.teams.createMembership({
      teamId: DELIVERY_PERSONS_TEAM_ID,
      userId: user.$id,
      roles: ["DELIVERY_PERSON"],
    });

    return this.dataBase.createRow({
      databaseId,
      tableId: "delivery_person",
      rowId: ID.unique(),
      data: {
        userId: user.$id,
        name: fullName,
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
      tableId: "delivery_person",
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
      tableId: "delivery_person",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (result.total === 0) {
      throw new NotFoundException("Delivery person profile not found");
    }

    const deliveryPerson = result.rows[0];

    await this.dataBase.updateRow({
      databaseId,
      tableId: "delivery_person",
      rowId: deliveryPerson.$id,
      data: { isAvailable },
    });

    return { success: true, isAvailable };
  }

  async getDeliveryPersonByUserId(userId: string) {
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const result = await this.dataBase.listRows({
      databaseId,
      tableId: "delivery_person",
      queries: [Query.equal("userId", userId), Query.limit(1)],
    });
    if (result.total === 0) {
      return null;
    }

    return result.rows[0];
  }
}

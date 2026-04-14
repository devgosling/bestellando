import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/service/database.service";
import { CreateRestaurantDto, RestaurantEntity } from "@repo/interfaces";
import {
  ID,
  Permission,
  Query,
  Role,
  TablesDB,
  Teams,
  Users,
} from "node-appwrite";
import { ConfigService } from "@nestjs/config";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { GeocodingService } from "../../address/service/geocoding.service";
import { RestaurantFilterDto } from "../dto/restaurant-filter.dto";

@Injectable()
export class RestaurantService {
  private readonly dataBase: TablesDB;
  private readonly teams: Teams;
  private readonly users: Users;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly appwriteService: AppwriteService,
    private readonly actorContextService: ActorContextService,
    private readonly geocodingService: GeocodingService,
  ) {
    this.dataBase = this.databaseService.getDatabase();
    this.teams = new Teams(this.appwriteService.getSDKClient());
    this.users = new Users(this.appwriteService.getSDKClient());
  }

  public async createRestaurant(params: CreateRestaurantDto) {
    const username = params.name.toLowerCase().replaceAll(" ", "_");

    const user = await this.users.create({
      userId: ID.unique(),
      name: username,
      email: params.email,
      password: params.password,
    });

    const team = await this.teams.create({
      teamId: ID.unique(),
      name: params.name,
    });

    await this.teams.createMembership({
      teamId: team.$id,
      userId: user.$id,
      roles: ["owner", "restaurant"],
    });

    const restaurantData: Record<string, unknown> = {
      name: params.name,
      description: "",
      phone: "",
      type: "other",
      isActive: false,
      minOrderValue: 0,
      deliveryFee: 0,
      estimatedDeliveryMinutes: 30,
      ownerId: user.$id,
    };

    if (params.partialAddress) {
      const coordinates = await this.geocodingService.forward({
        street: params.partialAddress.street,
        streetNumber: params.partialAddress.streetNumber,
        zipCode: params.partialAddress.zipCode,
        city: params.partialAddress.city,
      });

      const address = await this.dataBase.createRow({
        databaseId: this.configService.get<string>("DATABASE_ID")!,
        tableId: "address",
        rowId: ID.unique(),
        data: {
          ownerId: user.$id,
          ownerType: "RESTAURANT",
          street: params.partialAddress.street ?? "",
          streetNumber: params.partialAddress.streetNumber ?? "",
          zipCode: params.partialAddress.zipCode ?? "",
          city: params.partialAddress.city ?? "",
          isDefault: true,
          ...(coordinates ? { coordinates } : {}),
        },
      });

      restaurantData.address = address.$id;
    }

    await this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      rowId: ID.unique(),
      data: restaurantData,
      permissions: [
        Permission.read(Role.any()),
        Permission.update(Role.team(team.$id, "owner")),
      ],
    });

    return { success: true };
  }

  public async getRestaurantFromUser() {
    const actorContext = this.actorContextService.get();
    const userId = actorContext.user.id;
    const databaseId = this.configService.get<string>("DATABASE_ID")!;

    const restaurants = await this.dataBase.listRows({
      databaseId,
      tableId: "restaurant",
      queries: [Query.equal("ownerId", userId)],
    });

    for (const restaurant of restaurants.rows) {
      const r = restaurant as unknown as { $id: string; address?: { $id: string } | string | null };
      const hasAddress = typeof r.address === "object" ? !!r.address?.$id : !!r.address;
      if (hasAddress) continue;

      const addresses = await this.dataBase.listRows({
        databaseId,
        tableId: "address",
        queries: [Query.equal("ownerId", userId), Query.limit(1)],
      });
      const orphan = addresses.rows[0] as unknown as { $id: string; ownerType?: string } | undefined;
      if (!orphan) continue;

      if (orphan.ownerType !== "RESTAURANT") {
        await this.dataBase.updateRow({
          databaseId,
          tableId: "address",
          rowId: orphan.$id,
          data: { ownerType: "RESTAURANT" },
        });
      }
      await this.dataBase.updateRow({
        databaseId,
        tableId: "restaurant",
        rowId: r.$id,
        data: { address: orphan.$id },
      });
    }

    if (restaurants.rows.some((row) => {
      const r = row as unknown as { address?: { $id: string } | string | null };
      const hasAddress = typeof r.address === "object" ? !!r.address?.$id : !!r.address;
      return !hasAddress;
    })) {
      return await this.dataBase.listRows({
        databaseId,
        tableId: "restaurant",
        queries: [Query.equal("ownerId", userId)],
      });
    }

    return restaurants;
  }

  public async updateRestaurant(
    restaurantId: string,
    patch: Partial<RestaurantEntity>,
  ) {
    await this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      rowId: restaurantId,
      data: patch as object as Record<string, unknown>,
    });

    return { success: true };
  }

  public async listRestaurants(filters: RestaurantFilterDto) {
    const queries: string[] = [];

    if (filters.search) {
      queries.push(Query.search("name", filters.search));
    }
    if (filters.type) {
      queries.push(Query.equal("type", filters.type));
    }
    if (filters.isActive !== undefined) {
      queries.push(Query.equal("isActive", filters.isActive));
    }

    const limit = filters.limit ?? 25;
    const page = filters.page ?? 1;
    const offset = (page - 1) * limit;

    queries.push(Query.limit(limit));
    queries.push(Query.offset(offset));

    if (filters.sortBy) {
      queries.push(
        filters.sortOrder === "asc"
          ? Query.orderAsc(filters.sortBy)
          : Query.orderDesc(filters.sortBy),
      );
    }

    const result = await this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      queries,
    });

    return {
      data: result.rows,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  public async getRestaurantById(id: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      rowId: id,
    });
  }
}

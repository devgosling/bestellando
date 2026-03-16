/*
https://docs.nestjs.com/providers#services
*/

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
      roles: ["owner"],
    });

    await this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      rowId: ID.unique(),
      data: params.data as object as Record<string, unknown>,
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

    const { memberships } = await this.users.listMemberships({ userId });
    const teamIds = memberships.map((m) => m.teamId);

    if (!teamIds.length) return { total: 0, documents: [] };

    const restaurants = await this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "restaurant",
      queries: [
        Query.contains(
          "$permissions",
          teamIds.map((id) => `update("team:${id}/owner")`),
        ),
      ],
    });

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
}

/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/service/database.service";
import { CreateRestaurantDto } from "@repo/interfaces";
import { ID, Permission, Role, TablesDB, Teams, Users } from "node-appwrite";
import { ConfigService } from "@nestjs/config";
import { AppwriteService } from "src/auth/service/appwrite.service";

@Injectable()
export class RestaurantService {
  private readonly dataBase: TablesDB;
  private readonly teams: Teams;
  private readonly users: Users;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly appwriteService: AppwriteService,
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
        Permission.delete(Role.team(team.$id, "owner")),
      ],
    });
  }
}

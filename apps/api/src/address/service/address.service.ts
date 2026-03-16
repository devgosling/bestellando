import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { type AddressOwnerType } from "@repo/interfaces";
import { TablesDB, Teams, Users } from "node-appwrite";
import { ActorContextService } from "src/auth/service/actor-context.service";
import { AppwriteService } from "src/auth/service/appwrite.service";
import { DatabaseService } from "src/database/service/database.service";

@Injectable()
export class AddressService {
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

  public async createAddress(type: AddressOwnerType): Promise<void> {
    
  }
}

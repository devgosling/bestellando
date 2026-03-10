import { Injectable, Logger } from "@nestjs/common";
import { TablesDB } from "node-appwrite";
import { AppwriteService } from "src/auth/service/appwrite.service";

@Injectable()
export class DatabaseService {
  private readonly database: TablesDB;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly appwriteService: AppwriteService) {
    this.database = new TablesDB(this.appwriteService.getSDKClient());

    if (this.database) {
      this.logger.log("Database service initialized successfully");
    } else {
      this.logger.error("Failed to initialize Database service");
    }
  }

  public getDatabase(): TablesDB {
    return this.database;
  }
}

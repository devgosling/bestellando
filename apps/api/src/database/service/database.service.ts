import { Injectable, Logger } from '@nestjs/common';
import { Databases } from 'node-appwrite';
import { AppwriteService } from 'src/auth/service/appwrite.service';

@Injectable()
export class DatabaseService {
    private database: Databases;
    private logger = new Logger(DatabaseService.name)

    constructor(private readonly appwriteService: AppwriteService) {
        this.database = new Databases(this.appwriteService.getSDKClient())

        if (!!this.database) {
            this.logger.log('Database service initialized successfully');
        } else {
            this.logger.error('Failed to initialize Database service');
        }
    }

    public getDatabase() : Databases {
        return this.database;
    }
}
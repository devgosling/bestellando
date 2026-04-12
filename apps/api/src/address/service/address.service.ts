import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config/dist/config.service";
import { AddressEntity, type AddressOwnerType } from "@repo/interfaces";
import { ID, Query, TablesDB, Teams, Users } from "node-appwrite";
import { NotFoundError } from "rxjs";
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

  public async createAddress(type: AddressOwnerType, addressData: Partial<AddressEntity>) {
    const actorContext = this.actorContextService.get();

    const address = await this.dataBase.createRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: ID.unique(),
      data: {
        ...addressData,
      }
    })

    if (type === "RESTAURANT") {
      const restaurant = await this.dataBase.listRows({
        databaseId: this.configService.get<string>("DATABASE_ID")!,
        tableId: "restaurant",
        queries: [
          Query.equal("ownerId", actorContext.user.id),
          Query.limit(1),
        ]
      })

      if (restaurant.total === 0) {
        throw new NotFoundException("Restaurant not found for the current user");
      }

      await this.dataBase.updateRow({
        databaseId: this.configService.get<string>("DATABASE_ID")!,
        tableId: "restaurant",
        rowId: restaurant.rows[0].$id,
        data: {
          address: address.$id,
        }
      })
    }

    return address;
  }

  public async getMyAddresses(userId: string): Promise<AddressEntity[]> {
    const result = await this.dataBase.listRows({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      queries: [Query.equal("ownerId", userId)],
    });
    return result.rows as unknown as AddressEntity[];
  }

  public async getAddressById(id: string): Promise<AddressEntity> {
    const address = await this.dataBase.getRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: id,
    });
    if (!address) {
      throw new NotFoundException("Address not found");
    }
    return address as unknown as AddressEntity;
  }

  public async verifyOwnership(addressId: string, userId: string): Promise<void> {
    const address = await this.getAddressById(addressId);
    if (address.ownerId !== userId) {
      throw new ForbiddenException("You do not own this address");
    }
  }

  public async updateAddress(id: string, patch: Partial<AddressEntity>): Promise<AddressEntity> {
    const updated = await this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: id,
      data: { ...patch },
    });
    return updated as unknown as AddressEntity;
  }

  public async deleteAddress(id: string) {
    await this.dataBase.deleteRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: id,
    });
    return { success: true };
  }

  public async setDefault(addressId: string, userId: string) {
    const addresses = await this.getMyAddresses(userId);

    const updates = addresses
      .filter((addr) => addr.isDefault)
      .map((addr) =>
        this.dataBase.updateRow({
          databaseId: this.configService.get<string>("DATABASE_ID")!,
          tableId: "address",
          rowId: addr.$id,
          data: { isDefault: false },
        }),
      );
    await Promise.all(updates);

    await this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: addressId,
      data: { isDefault: true },
    });
    return { success: true };
  }
}

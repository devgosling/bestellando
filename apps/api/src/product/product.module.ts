import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { ProductService } from "./service/product.service";
import { ProductController } from "./controller/product.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}

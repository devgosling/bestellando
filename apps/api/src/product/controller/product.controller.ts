import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";
import { ProductService } from "../service/product.service";
import { type ProductEntity } from "@repo/interfaces";

@Controller({ path: "product", version: "1" })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() product: ProductEntity) {
    return this.productService.createProduct(product);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productService.getProductById(id);
  }

  @Get()
  findAll() {
    return this.productService.getAllProducts();
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() product: Partial<ProductEntity>) {
    return this.productService.updateProduct(id, product);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productService.deleteProduct(id);
  }
}

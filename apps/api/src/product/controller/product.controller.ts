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
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "product", version: "1" })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequireUserType(["RESTAURANT"])
  create(@Body() product: ProductEntity) {
    return this.productService.createProduct(product);
  }

  @Get(":id")
  @Public()
  findOne(@Param("id") id: string) {
    return this.productService.getProductById(id);
  }

  @Get()
  @Public()
  findAll() {
    return this.productService.getAllProducts();
  }

  @Patch(":id")
  @RequireUserType(["RESTAURANT"])
  update(@Param("id") id: string, @Body() product: Partial<ProductEntity>) {
    return this.productService.updateProduct(id, product);
  }

  @Delete(":id")
  @RequireUserType(["RESTAURANT"])
  remove(@Param("id") id: string) {
    return this.productService.deleteProduct(id);
  }
}

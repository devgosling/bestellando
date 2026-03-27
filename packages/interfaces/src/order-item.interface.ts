import { OrderEntity } from "./order.interface.js";
import { ProductEntity } from "./product.interface.js";

export interface OrderItemEntity {
    $id: string;
    order: OrderEntity;
    product: ProductEntity;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
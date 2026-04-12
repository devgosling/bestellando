import { OrderEntity, OrderStatus } from "./order.interface.js";

export interface OrderStatusHistoryEntity {
    $id: string;
    order: OrderEntity;
    status: OrderStatus;
    changedBy: string;
    changedAt: string;
}
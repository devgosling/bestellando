import { type OrderStatus } from "@repo/interfaces";
import { type UserType } from "../../user/interface/user.interface";
import { BadRequestException, ForbiddenException } from "@nestjs/common";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["PICKED_UP"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

// Which actor types can perform each transition
const TRANSITION_ACTORS: Record<string, UserType[]> = {
  "PENDING->CONFIRMED": ["RESTAURANT"],
  "PENDING->CANCELLED": ["CUSTOMER", "RESTAURANT"],
  "CONFIRMED->PREPARING": ["RESTAURANT"],
  "CONFIRMED->CANCELLED": ["RESTAURANT"],
  "PREPARING->READY": ["RESTAURANT"],
  "PREPARING->CANCELLED": ["RESTAURANT"],
  "READY->PICKED_UP": ["DELIVERY_PERSON"],
  "PICKED_UP->DELIVERED": ["DELIVERY_PERSON"],
};

export function validateTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
  actorType: UserType,
): void {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];
  if (!validNextStatuses || !validNextStatuses.includes(newStatus)) {
    throw new BadRequestException(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
    );
  }

  const transitionKey = `${currentStatus}->${newStatus}`;
  const allowedActors = TRANSITION_ACTORS[transitionKey];
  if (!allowedActors || !allowedActors.includes(actorType)) {
    throw new ForbiddenException(
      `User type ${actorType} cannot perform transition ${transitionKey}`,
    );
  }
}

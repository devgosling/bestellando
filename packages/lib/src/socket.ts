import { io, Socket } from "socket.io-client";
import { appwriteAccount } from "./appwrite";
import { properties } from "../consts/properties";

let orderSocket: Socket | null = null;
let deliverySocket: Socket | null = null;

async function createSocketConnection(namespace: string): Promise<Socket> {
  const { jwt } = await appwriteAccount.createJWT();

  const socket = io(`${properties.apiUrl}${namespace}`, {
    auth: { token: jwt },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 500,
    reconnectionDelayMax: 10000,
  });

  return socket;
}

export async function connectSockets(): Promise<void> {
  if (!orderSocket || orderSocket.disconnected) {
    orderSocket = await createSocketConnection("/orders");
  }
  if (!deliverySocket || deliverySocket.disconnected) {
    deliverySocket = await createSocketConnection("/delivery");
  }
}

export function disconnectSockets(): void {
  orderSocket?.disconnect();
  deliverySocket?.disconnect();
  orderSocket = null;
  deliverySocket = null;
}

export function getOrderSocket(): Socket | null {
  return orderSocket;
}

export function getDeliverySocket(): Socket | null {
  return deliverySocket;
}

# WebSocket-Architektur

## Stack

- **Server**: `@nestjs/platform-socket.io` + `socket.io@4`
- **Client**: `socket.io-client@4`

## Verbindungsaufbau

### Client (Browser)

```ts
// packages/lib/src/socket.ts
const orderSocket = io(`${API_URL}/orders`, {
  auth: { token: jwt },
});
const deliverySocket = io(`${API_URL}/delivery`, {
  auth: { token: jwt },
});
```

Wichtig: Der JWT geht im **`auth.token`**-Handshake-Param mit, nicht als HTTP-Header (HTTP-Header sind beim WS-Upgrade nicht zuverlässig).

### Server (Gateway)

```ts
@WebSocketGateway({
  namespace: "/orders",
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
})
export class OrderGateway implements OnGatewayConnection {
  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return client.disconnect();

    try {
      const account = await this.appwriteService
        .createClientWithJwt(token)
        .account.get();
      client.data.userId = account.$id;
    } catch {
      client.disconnect();
    }
  }
}
```

`client.data.userId` wird ab da pro Socket gespeichert und in jedem Event-Handler genutzt.

## Rooms

Socket.io-Rooms sind **named groups** von Sockets. Wir nutzen folgende Convention:

| Room | Mitglieder |
|------|------------|
| `order:<orderId>` | Customer + Restaurant + Driver der Bestellung |
| `restaurant:<restaurantId>:orders` | Restaurant-Owner |
| `delivery:<deliveryId>` | Driver + Customer |

### Subscribe-Flow

Client emittet `subscribe:*`:

```ts
orderSocket.emit("subscribe:order", { orderId });
```

Server tritt Room bei:

```ts
@SubscribeMessage("subscribe:order")
handleSubscribeOrder(client: Socket, payload: { orderId: string }) {
  // TODO: Permission-Check (gehört der User zum Order?)
  client.join(`order:${payload.orderId}`);
}
```

## Sending Events

### Vom Server an einen Room

```ts
this.server
  .to(`order:${orderId}`)
  .emit("order:status-changed", { ... });
```

### Vom Server an einen einzelnen Client

```ts
client.emit("custom-event", { ... });
```

### Vom Client an den Server

```ts
socket.emit("event-name", payload);
```

## Lifecycle-Events

```ts
socket.on("connect", () => console.log("Connected"));
socket.on("disconnect", () => console.log("Disconnected"));
socket.on("connect_error", (err) => console.error(err));
```

## Wiederverbindung

Socket.io reconnects automatisch bei Verbindungsabbruch. Wichtig: nach Reconnect müssen alle Rooms erneut betreten werden — typischerweise im `connect`-Handler:

```ts
socket.on("connect", () => {
  socket.emit("subscribe:order", { orderId });
});
```

Die Frontend-Hooks `useEffect` machen das idempotent.

## Skalierung

Aktuell **Single-Instance** ausgelegt. Für horizontale Skalierung wäre nötig:

- **Redis-Adapter** für Socket.io: `@socket.io/redis-adapter`
- **GpsStoreService** ersetzen durch Redis (mit TTL)
- **Sticky-Sessions** im Loadbalancer (Socket.io braucht das wegen Polling-Fallback) — oder nur WebSocket-Transport erlauben

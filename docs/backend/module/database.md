# Database-Modul

Pfad: `apps/api/src/database/`

Dünner Wrapper um Appwrites `node-appwrite` `TablesDB`.

## Datei-Übersicht

```
database/
├── database.module.ts
└── service/
    └── database.service.ts
```

## DatabaseService

`apps/api/src/database/service/database.service.ts`:

```ts
@Injectable()
export class DatabaseService {
  private readonly tablesDB: TablesDB;

  constructor(private readonly configService: ConfigService) {
    const client = new Client()
      .setEndpoint(configService.get("APPWRITE_ENDPOINT")!)
      .setProject(configService.get("APPWRITE_PROJECT_ID")!)
      .setKey(configService.get("APPWRITE_API_KEY")!);
    this.tablesDB = new TablesDB(client);
  }

  getDatabase(): TablesDB {
    return this.tablesDB;
  }
}
```

## Verwendung

In jedem Service, der DB-Zugriff braucht:

```ts
@Injectable()
export class OrderService {
  private readonly dataBase: TablesDB;

  constructor(private readonly databaseService: DatabaseService) {
    this.dataBase = this.databaseService.getDatabase();
  }

  async getOrderById(orderId: string) {
    return this.dataBase.getRow({
      databaseId: this.configService.get("DATABASE_ID")!,
      tableId: "order",
      rowId: orderId,
    });
  }
}
```

## Wichtige TablesDB-Methoden

| Methode | Beschreibung |
|---------|--------------|
| `getRow({ databaseId, tableId, rowId })` | Einzelne Row laden |
| `listRows({ databaseId, tableId, queries })` | Mehrere Rows mit Filtern/Sortierung |
| `createRow({ databaseId, tableId, rowId, data })` | Row anlegen |
| `updateRow({ databaseId, tableId, rowId, data })` | Row aktualisieren |
| `deleteRow({ databaseId, tableId, rowId })` | Row löschen |

## Query-Helper

Aus `node-appwrite` importieren:

```ts
import { Query } from "node-appwrite";

await this.dataBase.listRows({
  databaseId,
  tableId: "order",
  queries: [
    Query.equal("customer", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(25),
    Query.offset(0),
  ],
});
```

Gängige Query-Methoden:

- `Query.equal("field", value)`
- `Query.notEqual("field", value)`
- `Query.greaterThan("field", value)`
- `Query.contains("field", "substring")`
- `Query.search("field", "keyword")`
- `Query.orderAsc("field")`, `Query.orderDesc("field")`
- `Query.limit(n)`, `Query.offset(n)`
- `Query.startsWith("field", "prefix")`

## ID-Generierung

Beim Erstellen einer Row gibt es zwei Möglichkeiten:

```ts
import { ID } from "node-appwrite";

// Auto-generierte ID
await this.dataBase.createRow({
  databaseId,
  tableId: "order",
  rowId: ID.unique(),
  data: { ... },
});

// Custom ID
await this.dataBase.createRow({
  databaseId,
  tableId: "order",
  rowId: "my-custom-id",
  data: { ... },
});
```

## Beziehungen

Appwrite expandiert Beziehungen **eine Ebene tief**:

```ts
const order = await this.dataBase.getRow({...});
// order.restaurant ist ein Objekt mit allen Restaurant-Feldern
// ABER: order.restaurant.address ist nur ein String (die ID)
```

Für tiefere Embeddings musst du manuell zusätzliche `getRow`-Calls machen. Siehe [Order-Modul](./order.md) für ein Beispiel.

## Spezielle Felder (Appwrite-System)

Jede Row hat automatisch:

- `$id` — Primary Key
- `$createdAt` — ISO-Timestamp
- `$updatedAt` — ISO-Timestamp
- `$permissions` — Array von Permission-Strings
- `$databaseId`, `$tableId` — Meta-Info

Diese werden automatisch befüllt und können in Queries (`$createdAt`) referenziert werden.

## Module-Definition

`database.module.ts`:

```ts
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

`@Global()` macht den Service in allen anderen Modulen automatisch verfügbar — kein Import nötig.

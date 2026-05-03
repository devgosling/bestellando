# Tabellen (Detail)

Vollständiges Schema aller Appwrite-Tabellen.

## `address`

Adressen für Customer und Restaurants.

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | Primary Key |
| `userId` | String | – | – | Appwrite-User-ID (für Customer-Adressen) |
| `street` | String (255) | ✓ | – | Straße + Hausnummer |
| `city` | String (100) | ✓ | – | Stadt |
| `zipCode` | String (20) | ✓ | – | Postleitzahl |
| `country` | String (100) | ✓ | – | Land |
| `label` | String (50) | – | – | "Zuhause", "Büro", ... |
| `coordinates` | Point | ✓ | – | `[lng, lat]` |

## `restaurant`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `name` | String (100) | ✓ | – | |
| `description` | String (1000) | – | – | |
| `category` | String (50) | ✓ | – | "PIZZA", "BURGER", ... |
| `isActive` | Boolean | ✓ | true | |
| `isFeatured` | Boolean | – | false | Auf Startseite hervorheben |
| `ownerId` | String | ✓ | – | Appwrite-User-ID des Owners |
| `address` | Relation 1:1 → address | ✓ | – | |
| `deliveryFee` | Float | ✓ | 0 | EUR |
| `minOrderValue` | Float | ✓ | 0 | EUR |
| `rating` | Float | – | – | 0–5 |
| `phone` | String (30) | – | – | |
| `imageUrl` | String (500) | – | – | Banner/Logo |

## `product`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `restaurant` | Relation N:1 → restaurant | ✓ | – | |
| `name` | String (100) | ✓ | – | |
| `description` | String (1000) | – | – | |
| `basePrice` | Float | ✓ | – | EUR |
| `imageUrl` | String (500) | – | – | |
| `categoryName` | String (50) | – | – | Frei-Text-Kategorie |
| `isAvailable` | Boolean | ✓ | true | |
| `isFeatured` | Boolean | – | false | |

## `modifier_option`

⚠️ **`Product`-Feld mit großem P!**

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `Product` | Relation N:1 → product | ✓ | – | **Großes P!** |
| `name` | String (100) | ✓ | – | "Extra Käse" |
| `priceDelta` | Float | ✓ | 0 | Aufpreis (negativ erlaubt) |
| `groupName` | String (50) | – | – | "Beläge", "Größe" |
| `isRequired` | Boolean | – | false | |
| `isMultiple` | Boolean | – | false | |
| `isAvailable` | Boolean | ✓ | true | |

## `order`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `customer` | String | ✓ | – | Appwrite-User-ID |
| `restaurant` | Relation N:1 → restaurant | ✓ | – | |
| `deliveryAddress` | Relation N:1 → address | ✓ | – | |
| `currentStatus` | String | ✓ | "PENDING" | enum |
| `paymentStatus` | String | ✓ | "UNPAID" | "UNPAID"/"PAID"/"REFUNDED" |
| `subtotal` | Float | ✓ | – | EUR (snapshot) |
| `deliveryFee` | Float | ✓ | – | EUR (snapshot) |
| `totalAmount` | Float | ✓ | – | EUR |
| `specialInstructions` | String (500) | – | "" | |

### `currentStatus` enum
`PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `PICKED_UP`, `DELIVERED`, `CANCELLED`

## `order_item`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `order` | Relation N:1 → order | ✓ | – | |
| `product` | Relation N:1 → product | ✓ | – | |
| `quantity` | Integer | ✓ | – | |
| `unitPrice` | Float | ✓ | – | Snapshot zum Bestellzeitpunkt |
| `totalPrice` | Float | ✓ | – | unitPrice × quantity |
| `specialInstructions` | String (500) | – | – | |

## `order_item_modifier`

Junction-Tabelle für die ausgewählten Modifier eines Order-Items.

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `orderItem` | Relation N:1 → order_item | ✓ | – | |
| `modifierOption` | Relation N:1 → modifier_option | ✓ | – | |
| `deltaPrice` | Float | ✓ | – | Snapshot |

## `order_status_history`

Audit-Trail.

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `order` | Relation N:1 → order | ✓ | – | |
| `status` | String | ✓ | – | |
| `$createdAt` | Timestamp | ✓ | now | (auto) |

## `opening_hours`

Mehrere Slots pro `(restaurant, dayOfWeek)` möglich.

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `restaurant` | Relation N:1 → restaurant | ✓ | – | |
| `dayOfWeek` | Integer | ✓ | – | 0=So, 1=Mo, ..., 6=Sa |
| `openTime` | String (5) | ✓ | – | "HH:mm" |
| `closeTime` | String (5) | ✓ | – | "HH:mm" |

> **Kein** Unique-Index auf `(restaurant, dayOfWeek)`!

## `delivery`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `order` | Relation 1:1 → order | ✓ | – | |
| `deliveryPerson` | Relation N:1 → delivery_person | – | – | |
| `status` | String | ✓ | "PENDING_ASSIGNMENT" | enum |
| `assignedAt` | Timestamp | – | – | |
| `pickedUpAt` | Timestamp | – | – | |
| `deliveredAt` | Timestamp | – | – | |
| `proofImageId` | String | – | – | Appwrite-Storage-File-ID |

### `status` enum
`PENDING_ASSIGNMENT`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`

## `delivery_person`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `userId` | String | ✓ | – | Appwrite-User-ID |
| `name` | String (100) | ✓ | – | |
| `phone` | String (30) | ✓ | – | |
| `vehicleType` | String | ✓ | – | "BICYCLE"/"SCOOTER"/"CAR" |
| `isActive` | Boolean | ✓ | true | |

## `delivery_zone`

| Feld | Typ | Pflicht | Default | Beschreibung |
|------|-----|---------|---------|--------------|
| `$id` | String | ✓ | auto | |
| `restaurant` | Relation N:1 → restaurant | ✓ | – | |
| `name` | String (100) | ✓ | – | "Innenstadt" |
| `coordinates` | JSON-Array | ✓ | – | `[[lng,lat], [lng,lat], ...]` (Polygon) |
| `deliveryFee` | Float | – | – | Override pro Zone |

## Indizes (Empfehlung)

| Tabelle | Index |
|---------|-------|
| `restaurant` | `ownerId` (Lookup), `isActive` (Filter), `isFeatured` (Filter), `category` |
| `product` | `restaurant`, `(restaurant, isAvailable)` |
| `modifier_option` | `Product` |
| `order` | `customer + $createdAt`, `restaurant + $createdAt`, `currentStatus` |
| `order_item` | `order` |
| `order_status_history` | `(order, $createdAt)` |
| `opening_hours` | `restaurant` |
| `delivery` | `order`, `deliveryPerson + status` |
| `delivery_zone` | `restaurant` |

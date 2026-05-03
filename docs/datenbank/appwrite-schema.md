# Appwrite-Schema

Schritt-für-Schritt Anleitung, wie das Appwrite-Schema aufgebaut wird.

## Vorbereitung

1. Appwrite-Projekt anlegen (siehe [Setup → Appwrite einrichten](../setup/appwrite-setup.md))
2. Datenbank anlegen (z. B. `bestellando`)
3. Folgende Tabellen mit den unten beschriebenen Spalten erstellen

## Tabellen-Erstellung

Für jede Tabelle (siehe [Tabellen](./tabellen.md)) im Appwrite-Dashboard:
1. Database → "Create Table"
2. Tabellenname (snake_case): z. B. `order_item`
3. Spalten anlegen — Reihenfolge spielt keine Rolle, aber Beziehungen brauchen die Ziel-Tabelle bereits

### Beziehungs-Spalten

Pro Beziehung:
- Spalten-Typ: "Relationship"
- Ziel-Tabelle wählen
- "Two-way relationship?" — meistens nein (one-way)
- Cardinality: 1:1 / 1:N / N:1 / N:N
- "On Delete" — meistens "Restrict" (kein Cascading)

### Spezielle Typen

| Bestellando-Typ | Appwrite-Typ |
|-----------------|--------------|
| String | String (Größe je nach Feld) |
| Float (Beträge) | Float |
| Integer | Integer |
| Boolean | Boolean |
| ISO-Timestamp | DateTime |
| `[lng, lat]` | Point |
| Coordinates-Array (Polygon) | JSON-String oder Float-Array |

## Empfehlung: Reihenfolge der Tabellen-Erstellung

Damit Beziehungen aufeinander zeigen können, in dieser Reihenfolge:

1. `address` (keine Beziehungen)
2. `restaurant` (→ address)
3. `product` (→ restaurant)
4. `modifier_option` (→ product)
5. `opening_hours` (→ restaurant)
6. `delivery_zone` (→ restaurant)
7. `order` (→ restaurant, → address)
8. `order_item` (→ order, → product)
9. `order_item_modifier` (→ order_item, → modifier_option)
10. `order_status_history` (→ order)
11. `delivery_person` (eigenständig)
12. `delivery` (→ order, → delivery_person)

## Beispiel: `restaurant` anlegen

| Spalte | Typ | Größe | Pflicht | Default |
|--------|-----|-------|---------|---------|
| name | String | 100 | ✓ | – |
| description | String | 1000 | – | – |
| category | String | 50 | ✓ | – |
| isActive | Boolean | – | ✓ | true |
| isFeatured | Boolean | – | – | false |
| ownerId | String | 50 | ✓ | – |
| address | Relationship → address | – | ✓ | – |
| deliveryFee | Float | – | ✓ | 0 |
| minOrderValue | Float | – | ✓ | 0 |
| rating | Float | – | – | – |
| phone | String | 30 | – | – |
| imageUrl | String | 500 | – | – |

## Indizes

In Appwrite → Tabelle → Indexes:

| Tabelle | Index-Schlüssel | Typ |
|---------|------------------|-----|
| restaurant | ownerId | KEY |
| restaurant | isActive | KEY |
| restaurant | isFeatured | KEY |
| restaurant | category | KEY |
| product | restaurant | KEY |
| modifier_option | Product | KEY |
| order | customer | KEY |
| order | restaurant | KEY |
| order | currentStatus | KEY |
| order_item | order | KEY |
| order_status_history | order | KEY |
| opening_hours | restaurant | KEY |
| delivery | order | UNIQUE |
| delivery | deliveryPerson | KEY |
| delivery_zone | restaurant | KEY |

## Storage-Bucket

Zusätzlich zu Tabellen: ein Storage-Bucket für Beweisbilder.

1. Storage → "Create Bucket"
2. Bucket-ID: `delivery-proof`
3. Permissions: Read für Order-beteiligte (Customer + Restaurant), Write für DELIVERY_PERSON
4. Allowed File-Extensions: `jpg, jpeg, png, webp`
5. Maximum File Size: 5 MB

## Backup / Export

Appwrite bietet aktuell **keinen** built-in DB-Export. Möglichkeiten:

- Appwrite-CLI: `appwrite databases list-rows ... > backup.json`
- Eigener Backup-Cron-Job: API-Endpoint, der alle Tabellen exportiert
- Periodisches `node-appwrite`-Script

## Migration zwischen Environments

Es gibt keinen offiziellen Migration-Workflow. Typischer Ansatz:

1. Schema im Development-Projekt erstellen
2. Im Staging-Projekt **manuell** nachbilden (oder via CLI scripten)
3. Live-Daten ggf. mit eigenem Migrate-Script umziehen

# Bestellando Docs Viewer

Eine eigenständige React + Vite-App, die alle Markdown-Dokumente aus `../docs/` als interaktive, durchsuchbare Dokumentation rendert.

## Features

- **Modernes Dark-Blue-Design** mit dezentem Glow-Effekt
- **Sidebar-Navigation** mit collapsiblen Gruppen
- **Volltextsuche** über alle Docs (`Strg+K` / `⌘K`)
- **Tastatur-Navigation** in den Suchergebnissen (↑/↓ + Enter)
- **Sanfte Animationen** via Framer Motion
- **Code-Highlighting** mit angepasstem Dark-Theme
- **Auto-Resolving** der Markdown-`.md`-Links auf interne Routen
- **Responsive** (Mobile-Burger-Menu)

## Starten

```bash
cd docs-viewer
pnpm install            # oder: npm install
pnpm dev                # läuft auf http://localhost:5180
```

## Build (statische Dateien)

```bash
pnpm build              # Output: dist/
pnpm preview            # Preview des Builds
```

Die gebaute App ist eine **statische** SPA — kann auf jedem Static-Host (Vercel, Netlify, GitHub Pages, eigener Webserver) ausgeliefert werden.

## Wie es funktioniert

- `vite.config.ts` erlaubt File-Reads aus dem Eltern-Ordner (für `../docs/`).
- `import.meta.glob('../../../docs/**/*.md', { query: '?raw', eager: true })` lädt alle Markdowns zur Build-Zeit als Strings ins Bundle.
- `lib/tree.ts` baut aus den Pfaden eine Navigation auf, mit `README.md` als Index pro Ordner.
- `lib/search.ts` ist eine simple Term-basierte Volltextsuche mit Score (Title-Boost + Slug-Boost).
- `components/DocViewer.tsx` rendert per `react-markdown` mit `remark-gfm` (Tabellen, Strikethrough) und `rehype-highlight` (Code).
- Routing läuft hash-basiert (`#/setup/installation`) — keine Server-Konfiguration nötig.

## Anpassen

- **Farben**: alle Theme-Variablen stehen oben in `src/index.css` unter `:root`.
- **Reihenfolge der Hauptsektionen**: `SECTION_ORDER` in `src/lib/tree.ts`.
- **Section-Titel**: `SECTION_TITLES` in `src/lib/tree.ts`.

## Tastenkürzel

| Taste | Aktion |
|-------|--------|
| `Strg+K` / `⌘K` | Suche fokussieren |
| `↑` / `↓` | Suchergebnis wechseln |
| `Enter` | Aktives Suchergebnis öffnen |
| `Esc` | Suche schließen |

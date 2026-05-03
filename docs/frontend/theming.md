# Theming & Styling

## Tailwind CSS v4

Bestellando nutzt **Tailwind v4** mit **Tailwind v4-Konfig im CSS**.

Wichtige Dateien:
- `apps/web/src/index.css` — globaler Stylesheet, importiert Tailwind
- `apps/web/postcss.config.cjs` — PostCSS mit Tailwind-Plugin
- `apps/web/vite.config.ts` — Vite-Plugin für Tailwind v4

Beispiel `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(...);
  --color-foreground: oklch(...);
  --color-accent: oklch(...);
  /* ... */
}

.dark {
  --color-background: oklch(...);
  /* dark-mode-Werte */
}
```

## Theme-Variablen

Custom Properties, die Tailwind-Utilities generieren:

| Variable | Tailwind-Utility | Zweck |
|----------|-------------------|-------|
| `--color-background` | `bg-background` | Hintergrund |
| `--color-foreground` | `text-foreground` | Text |
| `--color-muted` | `text-muted` | gedämpfter Text |
| `--color-accent` | `bg-accent`, `text-accent` | Akzentfarbe |
| `--color-accent-foreground` | `text-accent-foreground` | Text auf Accent |
| `--color-border` | `border-border` | Rahmen |
| `--color-card` | `bg-card` | Card-Hintergrund |
| `--color-success` | `text-success` | Erfolg |
| `--color-warning` | `text-warning` | Warnung |
| `--color-danger` | `text-danger` | Fehler |

## Dark/Light-Mode

Per `class="dark"` auf `<html>`. Wird vom `ThemeProvider` gesetzt.

```tsx
// @repo/contexts/src/theme.ts
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

Persistiert in `localStorage`.

## HeroUI v3

Bestellando nutzt **HeroUI v3.0.0-beta.8** — eine Komponentenbibliothek auf Basis von **react-aria-components**.

### Wichtigste Regel: Compound-Pattern

V3 erwartet, dass du Compound-Subkomponenten **selbst** zusammensetzt. Naive v2-Style-Usage **funktioniert nicht** und bricht oft silently.

### `<Modal>`

❌ **Falsch**:
```tsx
<Modal>
  <ModalHeader>...</ModalHeader>
  <ModalBody>...</ModalBody>
</Modal>
```

✅ **Richtig**:
```tsx
<Modal>
  <ModalBackdrop>
    <ModalContainer>
      <ModalDialog>
        {/* eigentlicher Inhalt */}
      </ModalDialog>
    </ModalContainer>
  </ModalBackdrop>
</Modal>
```

### `<Input>` / `<TextArea>`

V3 hat **keinen** `label`-Prop. Stattdessen mit `<TextField>` wrappen:

❌ **Falsch**:
```tsx
<Input label="E-Mail" value={email} onValueChange={setEmail} />
```

✅ **Richtig**:
```tsx
<TextField value={email} onChange={setEmail}>
  <Label>E-Mail</Label>
  <Input />
</TextField>
```

### `<Select>`

```tsx
<Select selectedKey={value} onSelectionChange={(k) => setValue(k as string)}>
  <Label>Auswahl</Label>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectPopover>
    <ListBox>
      <ListBoxItem id="opt1">Option 1</ListBoxItem>
      <ListBoxItem id="opt2">Option 2</ListBoxItem>
    </ListBox>
  </SelectPopover>
</Select>
```

Wichtig: `id="..."` an jedem `ListBoxItem`.

### `<Tabs>`

```tsx
<Tabs selectedKey={tab} onSelectionChange={setTab}>
  <TabList>
    <Tab id="all">Alle</Tab>
    <Tab id="pending">Ausstehend</Tab>
  </TabList>
</Tabs>
```

`Tab` nimmt **children**, nicht `title`.

### `<Switch>`

❌ **Falsch**:
```tsx
<Switch isSelected={open} onValueChange={setOpen} />   // unsichtbar!
```

✅ **Richtig**:
```tsx
<Switch isSelected={open} onChange={setOpen}>
  <SwitchControl><SwitchThumb /></SwitchControl>
  <Label>Geöffnet</Label>
</Switch>
```

> Dafür gibt es den `<ToggleSwitch>`-Wrapper in `components/shared/`.

### `<Badge>`

`<Badge>` ist absolut positioniert und escaped seinen Parent. Wrap in `<BadgeAnchor>` (das `position: relative` setzt) und neben den Inhalt platzieren:

```tsx
<BadgeAnchor>
  <Avatar src={user.avatarUrl} />
  <Badge color="success">{cartCount}</Badge>
</BadgeAnchor>
```

### Event-Handler-Map

| HeroUI-Komponente | Event | NICHT |
|-------------------|-------|-------|
| `<Switch>` | `onChange(boolean)` | ~~`onValueChange`~~ |
| `<Input>` (bare) | `onChange(string)` | ~~`onValueChange`~~ |
| `<TextField>`-Wrapped Input | `onChange(string)` auf `<TextField>` | |
| `<Select>` | `onSelectionChange(key)` | ~~`onValueChange`~~ |
| `<Button>` | `onPress` (react-aria) | `onClick` funktioniert oft auch |
| `<Tabs>` | `onSelectionChange(key)` | |

## Animationen

Globale Page-Transitions via `<AnimatedPage>` (Framer-Motion):

```tsx
<AnimatedPage className="...">
  {children}
</AnimatedPage>
```

Macht ein einfaches `fade-in + scale` beim Mount.

## Icon-Sets

- **`@gravity-ui/icons`** — primärer Icon-Pack (z. B. `Person`, `Smartphone`, `ListCheck`)
- **`lucide-react`** — Fallback / Ergänzung

> Achtung: nicht alle Namen sind in `@gravity-ui/icons` v2.18 vorhanden. `Phone` zum Beispiel existiert nicht — nutze `Smartphone`.

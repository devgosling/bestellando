# `@repo/contexts`

Pfad: `packages/contexts/`

React-Contexts, die App-übergreifend nutzbar sein sollen.

## Datei-Struktur

```
packages/contexts/src/
├── index.ts
└── theme.ts
```

## ThemeProvider

```tsx
import { ThemeProvider } from "@repo/contexts";

<ThemeProvider>
  <App />
</ThemeProvider>
```

### Implementation

```ts
type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) ?? "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem("theme", t);
    setThemeState(t);
  };

  // System-Theme-Listener
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.toggle("dark", mq.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be inside ThemeProvider");
  return ctx;
}
```

### Verwendung

```tsx
import { useTheme } from "@repo/hooks";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button onPress={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? "🌞" : "🌙"}
    </Button>
  );
}
```

> Der `useTheme`-Hook aus `@repo/hooks` ist ein Convenience-Wrapper um `useThemeContext`.

## Erweiterung

Wenn weitere App-übergreifende Contexts gebraucht werden (z. B. `LocaleContext`, `NotificationContext`), gehören sie hierher.

Aktuell ist nur `ThemeProvider` enthalten — `AuthProvider` lebt im `apps/web/src/providers/`-Verzeichnis, weil er Appwrite-spezifisch ist.

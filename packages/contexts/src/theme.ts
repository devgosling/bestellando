import { createContext } from "react";

export type Theme = "LIGHT" | "DARK" | "SYSTEM";

export interface ThemeContextType {
  theme: Theme;
  updateTheme: (theme: Theme, withSave?: boolean) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

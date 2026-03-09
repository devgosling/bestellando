import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@repo/hooks";
import { router } from "./main";
import { useContext, useEffect } from "react";
import { PrimeReactContext } from "primereact/api";
import { RouterProvider } from "@tanstack/react-router";
import { useUserContext } from "./providers/useUserContext";

function App() {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { changeTheme } = useContext(PrimeReactContext);

  useEffect(() => {
    if (!changeTheme) {
      return;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const resolvedTheme =
      theme.theme === "SYSTEM" ? (prefersDark ? "DARK" : "LIGHT") : theme.theme;
    const desiredTheme =
      resolvedTheme === "DARK" ? "lara-dark-amber" : "lara-light-amber";
    const link = document.getElementById("app-theme") as HTMLLinkElement | null;
    const currentTheme = link?.href.includes("lara-dark-amber")
      ? "lara-dark-amber"
      : "lara-light-amber";

    if (currentTheme === desiredTheme) {
      return;
    }

    changeTheme(currentTheme, desiredTheme, "app-theme", () => {});
  }, [changeTheme, theme.theme]);

  const { userContext } = useUserContext();

  return (
    <RouterProvider
      router={router}
      context={{
        theme,
        userContext,
        queryClient,
      }}
    />
  );
}

export default App;

import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@repo/hooks";
import { router } from "./main";
import { RouterProvider } from "@tanstack/react-router";
import { useUserContext } from "./providers/useUserContext";

function App() {
  const theme = useTheme();
  const queryClient = useQueryClient();
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

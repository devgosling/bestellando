import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import type { Models } from "appwrite";
import type { ThemeContextType } from "@repo/contexts";
import Header from "../kit/header";
import Footer from "../kit/footer";

export interface UserContext {
  appwriteUser: Models.User;
  userRole?: "CUSTOMER" | "DELIVERY_PERSON" | "RESTAURANT" | "ADMIN";
}

const RootLayout = () => {
  const matches = useMatches();
  const lastMatch = matches[matches.length - 1];
  const staticData = lastMatch?.staticData as
    | { showHeader?: boolean; showFooter?: boolean }
    | undefined;

  return (
    <>
      {staticData?.showHeader && <Header />}
      <Outlet />
      {staticData?.showFooter && <Footer />}
    </>
  );
};

export interface RouterContext {
  userContext?: UserContext;
  theme: ThemeContextType;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

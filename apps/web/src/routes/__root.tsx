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
import BottomTabBar from "../components/shared/BottomTabBar";

export interface UserContext {
  appwriteUser: Models.User;
  userRole?: "CUSTOMER" | "DELIVERY_PERSON" | "RESTAURANT" | "ADMIN";
}

const RootLayout = () => {
  const matches = useMatches();
  const lastMatch = matches.at(matches.length - 1);
  const staticData = lastMatch?.staticData as
    | { showHeader?: boolean; showFooter?: boolean }
    | undefined;

  return (
    <>
      {staticData?.showHeader && <Header />}
      <main className="flex-1 pb-14 lg:pb-0">
        <Outlet />
      </main>
      <BottomTabBar />
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

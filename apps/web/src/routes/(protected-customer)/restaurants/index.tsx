import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import { useState } from "react";
import type { RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { EmptyState } from "../../../components/shared/EmptyState";
import { RestaurantCard } from "../../../components/restaurant/RestaurantCard";
import {
  RestaurantFilters,
  type RestaurantFiltersState,
} from "../../../components/restaurant/RestaurantFilters";

interface RestaurantSearchParams {
  search?: string;
  type?: string;
}

function buildQueryUrl(filters: RestaurantFiltersState): string {
  const params = new URLSearchParams();
  params.set("isActive", "true");
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  return `/v1/restaurant/list?${params.toString()}`;
}

const RestaurantsPage = () => {
  const searchParams = Route.useSearch();
  const [filters, setFilters] = useState<RestaurantFiltersState>({
    search: searchParams.search ?? "",
    type: (searchParams.type as RestaurantFiltersState["type"]) ?? "",
  });

  const { data, isLoading } = useApiQuery<{
    data: RestaurantEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    request: {
      url: buildQueryUrl(filters),
      requiresAuth: false,
    },
    queryKey: ["restaurants", filters.search, filters.type],
  });

  const restaurants = data?.data ?? [];

  return (
    <AnimatedPage className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Restaurants</h1>
      <RestaurantFilters filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        {isLoading ? (
          <LoadingSkeleton count={6} type="card" />
        ) : restaurants.length === 0 ? (
          <EmptyState
            title="Keine Restaurants gefunden"
            description="Versuche andere Suchbegriffe oder Filter."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.$id}
                restaurant={restaurant}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export const Route = createFileRoute(
  "/(protected-customer)/restaurants/",
)({
  component: RestaurantsPage,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
  validateSearch: (search: Record<string, unknown>): RestaurantSearchParams => ({
    search: typeof search.search === "string" ? search.search : undefined,
    type: typeof search.type === "string" ? search.type : undefined,
  }),
});

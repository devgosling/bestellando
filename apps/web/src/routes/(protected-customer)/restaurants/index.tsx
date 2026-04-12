import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import { useState } from "react";
import type { RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { EmptyState } from "../../../components/shared/EmptyState";
import { RestaurantCard } from "../../../components/restaurant/RestaurantCard";
import { RestaurantFilters } from "../../../components/restaurant/RestaurantFilters";

const RestaurantsPage = () => {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<string[]>([]);

  const { data, isLoading } = useApiQuery<{
    data: RestaurantEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    request: {
      url: `/v1/restaurant/list?isActive=true`,
      requiresAuth: false,
    },
    queryKey: ["restaurants"],
  });

  const allRestaurants = data?.data ?? [];

  const filtered = allRestaurants.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.includes("open") && !r.isActive) return false;
    if (filters.includes("free-delivery") && r.deliveryFee > 0) return false;
    return true;
  });

  return (
    <AnimatedPage>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">
        <h1 className="text-2xl font-bold text-foreground mt-0 mb-4">Restaurants</h1>
        <RestaurantFilters onSearchChange={setSearch} onFilterChange={setFilters} />

        {isLoading ? (
          <LoadingSkeleton type="card" count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Keine Restaurants gefunden"
            description="Versuche andere Suchbegriffe oder Filter"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <RestaurantCard key={r.$id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </AnimatedPage>
  );
};

export const Route = createFileRoute("/(protected-customer)/restaurants/")({
  component: RestaurantsPage,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

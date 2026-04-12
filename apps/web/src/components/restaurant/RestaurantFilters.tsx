import { Chip } from "@heroui/react";
import {
  RestaurantTypeNames,
  type RestaurantType,
} from "@repo/interfaces";
import { SearchInput } from "../shared/SearchInput";

export interface RestaurantFiltersState {
  search: string;
  type: RestaurantType | "";
}

interface RestaurantFiltersProps {
  filters: RestaurantFiltersState;
  onFiltersChange: (filters: RestaurantFiltersState) => void;
}

const restaurantTypes = Object.entries(RestaurantTypeNames) as [
  RestaurantType,
  string,
][];

export function RestaurantFilters({
  filters,
  onFiltersChange,
}: RestaurantFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleTypeToggle = (type: RestaurantType) => {
    onFiltersChange({
      ...filters,
      type: filters.type === type ? "" : type,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={filters.search}
        onChange={handleSearchChange}
        placeholder="Restaurant suchen..."
      />
      <div className="flex flex-wrap gap-2">
        {restaurantTypes.map(([key, label]) => (
          <Chip
            key={key}
            variant={filters.type === key ? "solid" : "flat"}
            color={filters.type === key ? "primary" : "default"}
            className="cursor-pointer"
            onClick={() => handleTypeToggle(key)}
          >
            {label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

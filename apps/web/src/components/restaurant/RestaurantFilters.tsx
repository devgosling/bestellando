import { Input, Chip } from "@heroui/react";
import { Magnifier } from "@gravity-ui/icons";
import { useState } from "react";

interface RestaurantFiltersProps {
  onSearchChange: (search: string) => void;
  onFilterChange: (filters: string[]) => void;
}

const QUICK_FILTERS = [
  { key: "open", label: "Geöffnet" },
  { key: "free-delivery", label: "Gratis Lieferung" },
  { key: "top-rated", label: "Beste Bewertung" },
];

export function RestaurantFilters({ onSearchChange, onFilterChange }: RestaurantFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const toggleFilter = (key: string) => {
    const updated = activeFilters.includes(key)
      ? activeFilters.filter((f) => f !== key)
      : [...activeFilters, key];
    setActiveFilters(updated);
    onFilterChange(updated);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <Input
        placeholder="Restaurant suchen..."
        startContent={<Magnifier className="size-4 text-muted" />}
        isClearable
        className="max-w-xs"
        size="sm"
        value={search}
        onValueChange={(val) => {
          setSearch(val);
          onSearchChange(val);
        }}
      />
      {QUICK_FILTERS.map((f) => (
        <Chip
          key={f.key}
          variant={activeFilters.includes(f.key) ? "solid" : "outline"}
          className={`cursor-pointer transition-colors ${
            activeFilters.includes(f.key) ? "bg-accent text-accent-foreground" : ""
          }`}
          onClick={() => toggleFilter(f.key)}
        >
          {f.label}
        </Chip>
      ))}
    </div>
  );
}

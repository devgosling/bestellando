import { Chip } from "@heroui/react";
import { Clock } from "@gravity-ui/icons";
import type { RestaurantEntity } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
import { OpeningHoursBadge } from "./OpeningHoursBadge";

interface RestaurantHeroProps {
  restaurant: RestaurantEntity;
}

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl bg-linear-to-br from-accent/80 to-accent"
    >
      <div className="px-6 py-8 sm:py-12">
        <div className="absolute top-4 right-4">
          <OpeningHoursBadge isActive={restaurant.isActive} />
        </div>
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          {restaurant.name}
        </h2>
        {restaurant.description && (
          <p className="mt-1 line-clamp-2 text-sm text-white/80">
            {restaurant.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Chip size="sm" variant="flat" className="bg-white/20 text-white">
            {RestaurantTypeNames[restaurant.type]}
          </Chip>
          <span className="flex items-center gap-1 text-sm text-white/90">
            <Clock className="h-4 w-4" />
            {restaurant.estimatedDeliveryMinutes} Min.
          </span>
          <span className="text-sm text-white/90">
            Lieferung:{" "}
            <PriceDisplay
              amount={restaurant.deliveryFee}
              className="text-white/90"
            />
          </span>
          <span className="text-sm text-white/90">
            Mindestbestellwert:{" "}
            <PriceDisplay
              amount={restaurant.minOrderValue}
              className="text-white/90"
            />
          </span>
        </div>
      </div>
    </div>
  );
}

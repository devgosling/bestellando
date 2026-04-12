import { Chip } from "@heroui/react";
import { Clock } from "@gravity-ui/icons";
import type { RestaurantEntity, RestaurantType } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
import { OpeningHoursBadge } from "./OpeningHoursBadge";

interface RestaurantHeroProps {
  restaurant: RestaurantEntity;
}

const typeGradients: Record<RestaurantType, string> = {
  italian: "from-red-500 to-orange-400",
  chinese: "from-amber-500 to-red-500",
  fast_food: "from-yellow-400 to-orange-500",
  vegetarian: "from-green-400 to-emerald-500",
  vegan: "from-lime-400 to-green-500",
  dessert: "from-pink-400 to-purple-400",
  mexican: "from-orange-500 to-red-400",
  indian: "from-amber-500 to-yellow-500",
  asian: "from-rose-400 to-amber-400",
  other: "from-slate-400 to-slate-500",
};

export function RestaurantHero({ restaurant }: RestaurantHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-xl">
      {restaurant.bannerUrl ? (
        <img
          src={restaurant.bannerUrl}
          alt={restaurant.name}
          className="h-56 w-full object-cover sm:h-72"
        />
      ) : (
        <div
          className={`h-56 w-full bg-gradient-to-br sm:h-72 ${typeGradients[restaurant.type]}`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {restaurant.name}
          </h1>
          <OpeningHoursBadge isActive={restaurant.isActive} />
        </div>
        {restaurant.description && (
          <p className="mt-1 line-clamp-2 text-sm text-white/80">
            {restaurant.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Chip size="sm" variant="flat" color="primary">
            {RestaurantTypeNames[restaurant.type]}
          </Chip>
          <span className="flex items-center gap-1 text-sm text-white/90">
            <Clock className="h-4 w-4" />
            {restaurant.estimatedDeliveryMinutes} Min.
          </span>
          <span className="text-sm text-white/90">
            Lieferung: <PriceDisplay amount={restaurant.deliveryFee} className="text-white/90" />
          </span>
          <span className="text-sm text-white/90">
            Mindestbestellwert: <PriceDisplay amount={restaurant.minOrderValue} className="text-white/90" />
          </span>
        </div>
      </div>
    </div>
  );
}

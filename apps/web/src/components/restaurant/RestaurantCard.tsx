import { Card, CardBody, Chip } from "@heroui/react";
import { Clock } from "@gravity-ui/icons";
import { useNavigate } from "@tanstack/react-router";
import type { RestaurantEntity, RestaurantType } from "@repo/interfaces";
import { RestaurantTypeNames } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";
import { OpeningHoursBadge } from "./OpeningHoursBadge";

interface RestaurantCardProps {
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

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: "/restaurants/$restaurantId", params: { restaurantId: restaurant.$id } });
  };

  return (
    <Card
      isPressable
      onPress={handleClick}
      className="overflow-hidden transition-transform hover:scale-[1.02]"
    >
      {restaurant.imageUrl ? (
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-40 w-full items-center justify-center bg-gradient-to-br ${typeGradients[restaurant.type]}`}
        >
          <span className="text-4xl font-bold text-white/80">
            {restaurant.name.charAt(0)}
          </span>
        </div>
      )}
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-lg font-semibold">{restaurant.name}</h3>
          <OpeningHoursBadge isActive={restaurant.isActive} />
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="flat" color="primary">
            {RestaurantTypeNames[restaurant.type]}
          </Chip>
        </div>
        {restaurant.description && (
          <p className="line-clamp-2 text-sm text-default-500">
            {restaurant.description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-3 text-xs text-default-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {restaurant.estimatedDeliveryMinutes} Min.
          </span>
          <span>
            Lieferung: <PriceDisplay amount={restaurant.deliveryFee} />
          </span>
          <span>
            Min.: <PriceDisplay amount={restaurant.minOrderValue} />
          </span>
        </div>
      </CardBody>
    </Card>
  );
}

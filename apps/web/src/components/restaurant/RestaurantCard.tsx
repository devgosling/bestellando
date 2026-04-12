import { Chip } from "@heroui/react";
import { StarFill, Clock } from "@gravity-ui/icons";
import { useNavigate } from "@tanstack/react-router";
import type { RestaurantEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";

interface RestaurantCardProps {
  restaurant: RestaurantEntity;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm border border-border bg-surface cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={() =>
        navigate({ to: "/restaurants/$restaurantId", params: { restaurantId: restaurant.$id } })
      }
    >
      {/* Image area */}
      <div className="h-32 bg-surface-secondary flex items-center justify-center">
        {restaurant.imageUrl ? (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-5xl">🍽️</span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-foreground mt-0 mb-1">
          {restaurant.name}
        </h3>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="flex items-center gap-0.5 font-semibold text-accent">
            <StarFill className="size-3" /> 4.5
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="size-3" /> {restaurant.estimatedDeliveryMinutes ?? "25-35"} min
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Chip size="sm" variant="flat" className="text-[10px]">
            Min. <PriceDisplay amount={restaurant.minOrderValue} />
          </Chip>
          {restaurant.deliveryFee === 0 && (
            <Chip size="sm" variant="flat" color="success" className="text-[10px]">
              Gratis Lieferung
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
}

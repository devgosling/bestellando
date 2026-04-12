import { Button } from "@heroui/react";
import type { ProductEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";

interface ProductCardProps {
  product: ProductEntity;
  onSelect: (product: ProductEntity) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <div
      className={`flex items-center justify-between py-3 px-1 border-b border-border last:border-b-0 ${!product.isAvailable ? "opacity-50" : "cursor-pointer"}`}
      role={product.isAvailable ? "button" : undefined}
      tabIndex={product.isAvailable ? 0 : undefined}
      onClick={(e) => {
        if (product.isAvailable && e.target === e.currentTarget) onSelect(product);
      }}
      onKeyDown={(e) => {
        if (product.isAvailable && (e.key === "Enter" || e.key === " ")) onSelect(product);
      }}
    >
      <div className="flex-1 min-w-0 mr-4">
        <span className="font-semibold text-foreground">{product.name}</span>
        {product.description && (
          <p className="text-xs text-muted line-clamp-1 mt-0.5">
            {product.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <PriceDisplay
          amount={product.basePrice}
          className="font-bold text-accent"
        />
        <Button
          isIconOnly
          size="sm"
          className="rounded-full bg-accent text-accent-foreground w-7 h-7 min-w-7"
          isDisabled={!product.isAvailable}
          onPress={() => onSelect(product)}
        >
          +
        </Button>
      </div>
    </div>
  );
}

import { Card, CardBody, Button } from "@heroui/react";
import type { ProductEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";

interface ProductCardProps {
  product: ProductEntity;
  onSelect: (product: ProductEntity) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card
      isPressable={product.isAvailable}
      onPress={() => product.isAvailable && onSelect(product)}
      className={`overflow-hidden ${!product.isAvailable ? "opacity-50" : "transition-transform hover:scale-[1.02]"}`}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-32 w-full object-cover"
        />
      )}
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold">{product.name}</h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-default-500">
                {product.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <PriceDisplay
            amount={product.basePrice}
            className="font-semibold text-primary"
          />
          <Button
            size="sm"
            color="primary"
            variant="flat"
            isDisabled={!product.isAvailable}
            onPress={() => onSelect(product)}
          >
            {product.isAvailable ? "Hinzuf\u00fcgen" : "Nicht verf\u00fcgbar"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

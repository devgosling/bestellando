import { Button, Switch } from "@heroui/react";
import { Pencil, TrashBin } from "@gravity-ui/icons";
import type { ProductEntity } from "@repo/interfaces";
import { PriceDisplay } from "../shared/PriceDisplay";

interface MenuProductRowProps {
  product: ProductEntity;
  onEdit: (product: ProductEntity) => void;
  onDelete: (product: ProductEntity) => void;
  onToggleAvailability: (product: ProductEntity, isAvailable: boolean) => void;
}

export function MenuProductRow({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuProductRowProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="size-14 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface text-muted text-xl font-bold">
          {product.name.charAt(0)}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">{product.name}</span>
          {product.isFeatured && (
            <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
              Empfohlen
            </span>
          )}
        </div>
        <span className="truncate text-sm text-muted">
          {product.description}
        </span>
        <PriceDisplay
          amount={product.basePrice}
          className="text-sm font-medium"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <Switch
          size="sm"
          isSelected={product.isAvailable}
          onValueChange={(val) => onToggleAvailability(product, val)}
          aria-label="Verfuegbar"
        />
        <Button
          isIconOnly
          variant="flat"
          size="sm"
          onPress={() => onEdit(product)}
          aria-label="Bearbeiten"
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          isIconOnly
          variant="flat"
          color="danger"
          size="sm"
          onPress={() => onDelete(product)}
          aria-label="Loeschen"
        >
          <TrashBin className="size-4" />
        </Button>
      </div>
    </div>
  );
}

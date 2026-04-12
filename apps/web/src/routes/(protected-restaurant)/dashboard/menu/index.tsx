import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@heroui/react";
import { Plus, Book } from "@gravity-ui/icons";
import { useApiQuery, useApiMutation } from "@repo/hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { ProductEntity, RestaurantEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../../components/shared/LoadingSkeleton";
import { EmptyState } from "../../../../components/shared/EmptyState";
import { SearchInput } from "../../../../components/shared/SearchInput";
import { ConfirmDialog } from "../../../../components/shared/ConfirmDialog";
import { MenuProductRow } from "../../../../components/dashboard/MenuProductRow";
import { ProductFormModal } from "../../../../components/dashboard/ProductFormModal";

function MenuPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<
    ProductEntity | undefined
  >();
  const [deletingProduct, setDeletingProduct] = useState<
    ProductEntity | undefined
  >();

  const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
    request: { url: "/v1/restaurant/mine" },
    queryKey: ["restaurant", "mine"],
  });

  const restaurant = restaurants?.[0];

  const { data: products, isLoading } = useApiQuery<ProductEntity[]>({
    request: { url: "/v1/product" },
    queryKey: ["products"],
    enabled: !!restaurant,
  });

  const createMutation = useApiMutation<ProductEntity, Error, Record<string, unknown>>({
    request: { url: "/v1/product", method: "POST" },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
  });

  const updateMutation = useApiMutation<ProductEntity, Error, Record<string, unknown>>({
    request: {
      url: `/v1/product/${editingProduct?.$id}`,
      method: "PATCH",
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setEditingProduct(undefined);
      setModalOpen(false);
    },
  });

  const deleteMutation = useApiMutation<void, Error, void>({
    request: {
      url: `/v1/product/${deletingProduct?.$id}`,
      method: "DELETE",
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeletingProduct(undefined);
    },
  });

  const toggleMutation = useApiMutation<
    ProductEntity,
    Error,
    { id: string; isAvailable: boolean }
  >({
    request: {
      url: "/v1/product",
      method: "PATCH",
    },
    mutationFn: async (variables) => {
      const { authenticatedFetch } = await import("@repo/lib");
      return authenticatedFetch(`/v1/product/${variables.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isAvailable: variables.isAvailable }),
      });
    },
    success: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const restaurantProducts = (products ?? []).filter((p) =>
    restaurant ? p.restaurant.$id === restaurant.$id : true,
  );

  const filteredProducts = restaurantProducts.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenCreate = () => {
    setEditingProduct(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: ProductEntity) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSubmit = (data: Record<string, unknown>) => {
    if (editingProduct) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate({
        ...data,
        restaurantId: restaurant?.$id,
      });
    }
  };

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Speisekarte</h1>
          <p className="text-sm text-default-500">
            Produkte verwalten und bearbeiten
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="size-4" />}
          onPress={handleOpenCreate}
        >
          Neues Produkt
        </Button>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Produkte suchen..."
      />

      {isLoading ? (
        <LoadingSkeleton count={4} type="row" />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          title="Keine Produkte"
          description={
            search
              ? "Keine Produkte fuer diese Suche gefunden."
              : "Fuege dein erstes Produkt hinzu."
          }
          icon={<Book className="size-12" />}
          action={
            !search ? (
              <Button color="primary" onPress={handleOpenCreate}>
                Neues Produkt
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProducts.map((product) => (
            <MenuProductRow
              key={product.$id}
              product={product}
              onEdit={handleOpenEdit}
              onDelete={setDeletingProduct}
              onToggleAvailability={(p, val) =>
                toggleMutation.mutate({ id: p.$id, isAvailable: val })
              }
            />
          ))}
        </div>
      )}

      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSubmit={handleSubmit}
        product={editingProduct}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(undefined)}
        onConfirm={() => deleteMutation.mutate()}
        title="Produkt loeschen"
        description={`Moechtest du "${deletingProduct?.name}" wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.`}
        confirmLabel="Loeschen"
        variant="danger"
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/menu/",
)({
  component: MenuPage,
  staticData: { showHeader: true, showFooter: false },
});

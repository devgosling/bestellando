import { createFileRoute } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import { useState } from "react";
import type { RestaurantEntity, ProductEntity } from "@repo/interfaces";
import { AnimatedPage } from "../../../components/shared/AnimatedPage";
import { LoadingSkeleton } from "../../../components/shared/LoadingSkeleton";
import { RestaurantHero } from "../../../components/restaurant/RestaurantHero";
import { MenuSection } from "../../../components/restaurant/MenuSection";
import { ProductCard } from "../../../components/restaurant/ProductCard";
import { ProductModal } from "../../../components/restaurant/ProductModal";

const RestaurantDetailPage = () => {
  const { restaurantId } = Route.useParams();
  const [selectedProduct, setSelectedProduct] = useState<ProductEntity | null>(
    null,
  );

  const { data: restaurant, isLoading: isLoadingRestaurant } =
    useApiQuery<RestaurantEntity>({
      request: {
        url: `/v1/restaurant/${restaurantId}`,
        requiresAuth: false,
      },
      queryKey: ["restaurant", restaurantId],
    });

  const { data: productsData, isLoading: isLoadingProducts } = useApiQuery<{
    data: ProductEntity[];
  }>({
    request: {
      url: `/v1/product?restaurantId=${restaurantId}`,
      requiresAuth: false,
    },
    queryKey: ["products", restaurantId],
  });

  const products = productsData?.data ?? [];
  const featuredProducts = products.filter((p) => p.isFeatured);
  const regularProducts = products.filter((p) => !p.isFeatured);
  const isLoading = isLoadingRestaurant || isLoadingProducts;

  if (isLoading) {
    return (
      <AnimatedPage className="mx-auto max-w-7xl px-4 py-6">
        <LoadingSkeleton count={1} type="card" />
        <div className="mt-6">
          <LoadingSkeleton count={6} type="card" />
        </div>
      </AnimatedPage>
    );
  }

  if (!restaurant) return null;

  return (
    <AnimatedPage className="mx-auto max-w-7xl px-4 py-6">
      <RestaurantHero restaurant={restaurant} />

      <div className="mt-8 flex flex-col gap-8">
        {featuredProducts.length > 0 && (
          <MenuSection title="Empfehlungen">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.$id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </MenuSection>
        )}

        {regularProducts.length > 0 && (
          <MenuSection title="Speisekarte">
            {regularProducts.map((product) => (
              <ProductCard
                key={product.$id}
                product={product}
                onSelect={setSelectedProduct}
              />
            ))}
          </MenuSection>
        )}

        {products.length === 0 && (
          <p className="py-12 text-center text-default-400">
            Keine Produkte verf&uuml;gbar.
          </p>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
      />
    </AnimatedPage>
  );
};

export const Route = createFileRoute(
  "/(protected-customer)/restaurants/$restaurantId",
)({
  component: RestaurantDetailPage,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});

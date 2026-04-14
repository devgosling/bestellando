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
import { CartSidebar } from "../../../components/cart/CartSidebar";
import { CartBottomBar } from "../../../components/cart/CartBottomBar";

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

  const { data: productsData, isLoading: isLoadingProducts } =
    useApiQuery<ProductEntity[]>({
      request: {
        url: `/v1/product?restaurantId=${restaurantId}`,
        requiresAuth: false,
      },
      queryKey: ["products", restaurantId],
    });

  const products = productsData ?? [];
  const featuredProducts = products.filter((p) => p.isFeatured);
  const regularProducts = products.filter((p) => !p.isFeatured);
  const isLoading = isLoadingRestaurant || isLoadingProducts;

  if (isLoading) {
    return (
      <AnimatedPage className="mx-auto max-w-[1280px] px-4 py-6">
        <LoadingSkeleton count={1} type="card" />
        <div className="mt-6">
          <LoadingSkeleton count={6} type="card" />
        </div>
      </AnimatedPage>
    );
  }

  if (!restaurant) return null;

  return (
    <AnimatedPage>
      <div className="max-w-[1280px] mx-auto">
        <RestaurantHero restaurant={restaurant} />
        <div className="flex">
          {/* Menu area */}
          <div className="flex-1 lg:w-[60%] px-4 py-6">
            {/* Menu sections */}
            <div className="flex flex-col gap-8">
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
                <p className="py-12 text-center text-muted">
                  Keine Produkte verfügbar.
                </p>
              )}
            </div>
          </div>

          {/* Cart sidebar - desktop only */}
          <div className="hidden lg:block w-[40%] border-l border-border sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
            <CartSidebar deliveryFee={restaurant.deliveryFee} />
          </div>
        </div>

        {/* Cart bottom bar - mobile only */}
        <CartBottomBar />
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

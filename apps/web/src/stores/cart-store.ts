import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductEntity } from "@repo/interfaces";

export interface CartItem {
  product: ProductEntity;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  pendingItem: {
    product: ProductEntity;
    quantity: number;
    instructions?: string;
  } | null;

  addItem: (
    product: ProductEntity,
    quantity: number,
    instructions?: string,
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setPendingItem: (
    product: ProductEntity,
    quantity: number,
    instructions?: string,
  ) => void;
  confirmPendingItem: () => void;
  cancelPendingItem: () => void;

  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      pendingItem: null,

      addItem: (product, quantity, instructions) => {
        const state = get();
        const incomingRestaurantId = product.restaurant.$id;

        // Single-restaurant enforcement: set pending item if switching restaurants
        if (
          state.restaurantId !== null &&
          state.restaurantId !== incomingRestaurantId
        ) {
          set({
            pendingItem: { product, quantity, instructions },
          });
          return;
        }

        const existingIndex = state.items.findIndex(
          (item) => item.product.$id === product.$id,
        );

        if (existingIndex >= 0) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
            specialInstructions:
              instructions ?? updatedItems[existingIndex].specialInstructions,
          };
          set({ items: updatedItems });
        } else {
          set({
            items: [
              ...state.items,
              { product, quantity, specialInstructions: instructions },
            ],
            restaurantId: incomingRestaurantId,
            restaurantName: product.restaurant.name,
          });
        }
      },

      removeItem: (productId) => {
        const items = get().items.filter(
          (item) => item.product.$id !== productId,
        );
        if (items.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const updatedItems = get().items.map((item) =>
          item.product.$id === productId ? { ...item, quantity } : item,
        );
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      setPendingItem: (product, quantity, instructions) => {
        set({ pendingItem: { product, quantity, instructions } });
      },

      confirmPendingItem: () => {
        const pending = get().pendingItem;
        if (!pending) return;
        set({
          items: [
            {
              product: pending.product,
              quantity: pending.quantity,
              specialInstructions: pending.instructions,
            },
          ],
          restaurantId: pending.product.restaurant.$id,
          restaurantName: pending.product.restaurant.name,
          pendingItem: null,
        });
      },

      cancelPendingItem: () => {
        set({ pendingItem: null });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.product.basePrice * item.quantity,
          0,
        );
      },
    }),
    {
      name: "bestellando-cart",
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName,
      }),
    },
  ),
);

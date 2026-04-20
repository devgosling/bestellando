import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductEntity } from "@repo/interfaces";

export interface CartModifier {
  $id: string;
  name: string;
  priceDelta: number;
}

export interface CartItem {
  id: string;
  product: ProductEntity;
  quantity: number;
  specialInstructions?: string;
  modifiers: CartModifier[];
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  pendingItem: {
    product: ProductEntity;
    quantity: number;
    instructions?: string;
    modifiers: CartModifier[];
  } | null;

  addItem: (
    product: ProductEntity,
    quantity: number,
    instructions?: string,
    modifiers?: CartModifier[],
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setPendingItem: (
    product: ProductEntity,
    quantity: number,
    instructions?: string,
    modifiers?: CartModifier[],
  ) => void;
  confirmPendingItem: () => void;
  cancelPendingItem: () => void;

  getTotalItems: () => number;
  getSubtotal: () => number;
}

function lineUnitPrice(item: Pick<CartItem, "product" | "modifiers">) {
  const mods = item.modifiers.reduce((sum, m) => sum + (m.priceDelta || 0), 0);
  return item.product.basePrice + mods;
}

function modifiersKey(modifiers: CartModifier[]) {
  return modifiers
    .map((m) => m.$id)
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

function buildItemId(productId: string, modifiers: CartModifier[]) {
  const key = modifiersKey(modifiers);
  return key ? `${productId}::${key}` : productId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      pendingItem: null,

      addItem: (product, quantity, instructions, modifiers = []) => {
        const state = get();
        const restaurantRel = product.restaurant;
        const incomingRestaurantId =
          typeof restaurantRel === "string"
            ? restaurantRel
            : restaurantRel?.$id ?? "";

        if (
          state.restaurantId !== null &&
          state.restaurantId !== incomingRestaurantId
        ) {
          set({
            pendingItem: { product, quantity, instructions, modifiers },
          });
          return;
        }

        const itemId = buildItemId(product.$id, modifiers);
        const existingIndex = state.items.findIndex((i) => i.id === itemId);

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
              {
                id: itemId,
                product,
                quantity,
                specialInstructions: instructions,
                modifiers,
              },
            ],
            restaurantId: incomingRestaurantId,
            restaurantName:
              typeof restaurantRel === "object"
                ? restaurantRel?.name ?? null
                : null,
          });
        }
      },

      removeItem: (itemId) => {
        const items = get().items.filter((item) => item.id !== itemId);
        if (items.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items });
        }
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        const updatedItems = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        );
        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [], restaurantId: null, restaurantName: null });
      },

      setPendingItem: (product, quantity, instructions, modifiers = []) => {
        set({ pendingItem: { product, quantity, instructions, modifiers } });
      },

      confirmPendingItem: () => {
        const pending = get().pendingItem;
        if (!pending) return;
        set({
          items: [
            {
              id: buildItemId(pending.product.$id, pending.modifiers),
              product: pending.product,
              quantity: pending.quantity,
              specialInstructions: pending.instructions,
              modifiers: pending.modifiers,
            },
          ],
          restaurantId:
            typeof pending.product.restaurant === "string"
              ? pending.product.restaurant
              : pending.product.restaurant?.$id ?? null,
          restaurantName:
            typeof pending.product.restaurant === "object"
              ? pending.product.restaurant?.name ?? null
              : null,
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
          (total, item) => total + lineUnitPrice(item) * item.quantity,
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

export { lineUnitPrice };

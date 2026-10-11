import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

// Types
export interface CartItem {
  productId: string;
  variantKey?: string;
  slug?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: string;
}

export const cartVariantKey = (
  item: Pick<CartItem, "productId" | "color" | "size">,
) => `${item.productId}::${item.color ?? ""}::${item.size ?? ""}`;

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface CartActions {
  addItem: (
    item: Omit<CartItem, "quantity" | "variantKey">,
    quantity?: number,
  ) => void;
  removeItem: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export type CartStore = CartState & CartActions;

// Default state
export const defaultInitState: CartState = {
  items: [],
  isOpen: false,
};

/**
 * Cart store factory - creates new store instance per provider
 * Uses persist middleware with skipHydration for Next.js SSR compatibility
 * @see https://zustand.docs.pmnd.rs/guides/nextjs#hydration-and-asynchronous-storages
 */
export const createCartStore = (initState: CartState = defaultInitState) => {
  return createStore<CartStore>()(
    persist(
      (set) => ({
        ...initState,

        addItem: (item, quantity = 1) =>
          set((state) => {
            const existing = state.items.find(
              (i) =>
                (i.variantKey ?? cartVariantKey(i)) === cartVariantKey(item),
            );
            if (existing) {
              return {
                items: state.items.map((i) =>
                  (i.variantKey ?? cartVariantKey(i)) === cartVariantKey(item)
                    ? { ...i, quantity: i.quantity + quantity }
                    : i,
                ),
              };
            }
            return {
              items: [
                ...state.items,
                { ...item, variantKey: cartVariantKey(item), quantity },
              ],
            };
          }),

        removeItem: (variantKey) =>
          set((state) => ({
            items: state.items.filter(
              (i) => (i.variantKey ?? cartVariantKey(i)) !== variantKey,
            ),
          })),

        updateQuantity: (variantKey, quantity) =>
          set((state) => {
            if (quantity <= 0) {
              return {
                items: state.items.filter(
                  (i) => (i.variantKey ?? cartVariantKey(i)) !== variantKey,
                ),
              };
            }
            return {
              items: state.items.map((i) =>
                (i.variantKey ?? cartVariantKey(i)) === variantKey
                  ? { ...i, quantity }
                  : i,
              ),
            };
          }),

        clearCart: () => set({ items: [] }),
        toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
        openCart: () => set({ isOpen: true }),
        closeCart: () => set({ isOpen: false }),
      }),
      {
        name: "cart-storage",
        // Skip automatic hydration - we'll trigger it manually on the client
        skipHydration: true,
        // Only persist items, not UI state like isOpen
        partialize: (state) => ({ items: state.items }),
      },
    ),
  );
};

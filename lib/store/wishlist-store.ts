import { createStore } from "zustand/vanilla";

export interface WishlistProduct {
  _id: string;
  name: string | null;
  slug: string | null;
  price: number | null;
  images: Array<{
    _key?: string;
    asset?: { _id?: string; url?: string | null } | null;
  }> | null;
  category?: {
    _id?: string;
    title?: string | null;
    slug?: string | null;
  } | null;
  fabric?: string | null;
  colors?: string[] | null;
  gender?: string | null;
  size?: string[] | null;
  fit?: string | null;
  pattern?: string | null;
  stock?: number | null;
}

export interface WishlistState {
  products: WishlistProduct[];
  status: "loading" | "ready" | "error";
  pendingIds: string[];
  setProducts: (products: WishlistProduct[]) => void;
  setStatus: (status: WishlistState["status"]) => void;
  setPending: (id: string, pending: boolean) => void;
  addProduct: (product: WishlistProduct) => void;
  removeProduct: (productId: string) => void;
  clear: () => void;
}

export const createWishlistStore = () =>
  createStore<WishlistState>((set) => ({
    products: [],
    status: "loading",
    pendingIds: [],
    setProducts: (products) => set({ products, status: "ready" }),
    setStatus: (status) => set({ status }),
    setPending: (id, pending) =>
      set((state) => ({
        pendingIds: pending
          ? [...new Set([...state.pendingIds, id])]
          : state.pendingIds.filter((pendingId) => pendingId !== id),
      })),
    addProduct: (product) =>
      set((state) =>
        state.products.some((item) => item._id === product._id)
          ? state
          : { products: [...state.products, product], status: "ready" },
      ),
    removeProduct: (productId) =>
      set((state) => ({
        products: state.products.filter((product) => product._id !== productId),
      })),
    clear: () => set({ products: [], status: "ready", pendingIds: [] }),
  }));

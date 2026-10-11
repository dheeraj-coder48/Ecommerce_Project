"use client";

import { useAuth } from "@clerk/nextjs";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useStore } from "zustand";
import { createWishlistStore, type WishlistState } from "./wishlist-store";

type WishlistStoreApi = ReturnType<typeof createWishlistStore>;
const WishlistStoreContext = createContext<WishlistStoreApi | null>(null);

export function WishlistStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<WishlistStoreApi | null>(null);
  if (!storeRef.current) storeRef.current = createWishlistStore();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const store = storeRef.current;
    if (!store || !isLoaded) return;
    if (!isSignedIn) {
      store.getState().clear();
      return;
    }

    const controller = new AbortController();
    store.getState().clear();
    store.getState().setStatus("loading");
    fetch("/api/wishlist", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your wishlist");
        return (await response.json()) as {
          products: WishlistState["products"];
        };
      })
      .then(({ products }) => store.getState().setProducts(products))
      .catch(() => {
        if (!controller.signal.aborted) store.getState().setStatus("error");
      });

    return () => controller.abort();
  }, [isLoaded, isSignedIn]);

  return (
    <WishlistStoreContext.Provider value={storeRef.current}>
      {children}
    </WishlistStoreContext.Provider>
  );
}

export function useWishlistStore<T>(selector: (state: WishlistState) => T): T {
  const store = useContext(WishlistStoreContext);
  if (!store)
    throw new Error(
      "useWishlistStore must be used inside WishlistStoreProvider",
    );
  return useStore(store, selector);
}

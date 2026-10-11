"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PRODUCT_BY_SLUG_QUERYResult } from "@/sanity.types";

type ProductImages = NonNullable<NonNullable<PRODUCT_BY_SLUG_QUERYResult>["images"]>;

export function ProductGallery({ images, productName }: { images: ProductImages | null; productName: string | null }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef<number | null>(null);
  const didSwipe = useRef(false);
  const items = images ?? [];
  const move = useCallback((delta: number) => setSelectedIndex((index) => (index + delta + items.length) % items.length), [items.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(false);
      if (event.key === "ArrowRight") move(1);
      if (event.key === "ArrowLeft") move(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightbox, move]);

  if (!items.length) return <div className="flex aspect-[4/5] items-center justify-center bg-zinc-100 text-sm text-zinc-500">No product images</div>;
  const selectedImage = items[selectedIndex];
  const swipeStart = (x: number) => {
    touchStart.current = x;
    didSwipe.current = false;
  };
  const swipeEnd = (x: number) => {
    if (touchStart.current === null) return;
    const distance = x - touchStart.current;
    if (Math.abs(distance) > 45) {
      didSwipe.current = true;
      move(distance < 0 ? 1 : -1);
    }
    touchStart.current = null;
  };

  return (
    <>
      <div className="grid min-w-0 gap-2 lg:grid-cols-[72px_minmax(0,1fr)] lg:gap-4">
        <div className="order-2 flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain px-5 pb-1 sm:px-0 lg:order-1 lg:max-h-[76vh] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto">
          {items.map((item, index) => (
            <button key={item._key ?? index} type="button" onClick={() => setSelectedIndex(index)} aria-label={`View image ${index + 1}`} aria-pressed={selectedIndex === index} className={cn("relative aspect-[4/5] h-[4.5rem] w-14 shrink-0 cursor-pointer overflow-hidden border lg:h-auto lg:w-full", selectedIndex === index ? "border-emerald-900 ring-1 ring-emerald-900" : "border-zinc-200 opacity-75 hover:opacity-100")}>
              {item.asset?.url && <Image src={item.asset.url} alt={`${productName ?? "Product"}, image ${index + 1}`} fill sizes="72px" className="object-cover" />}
            </button>
          ))}
        </div>
        <div className="relative order-1 mx-auto aspect-[4/5] max-h-[min(62svh,38rem)] w-[min(100%,49.6svh)] min-w-0 overflow-hidden bg-[#f0eee8] sm:max-h-[72svh] sm:w-[min(100%,57.6svh)] lg:order-2 lg:max-h-[76vh] lg:w-full" onTouchStart={(event) => swipeStart(event.touches[0]?.clientX ?? 0)} onTouchEnd={(event) => swipeEnd(event.changedTouches[0]?.clientX ?? 0)}>
          <button type="button" onClick={() => { if (didSwipe.current) { didSwipe.current = false; return; } setLightbox(true); }} aria-label="Open product image viewer" className="absolute inset-0 z-10 cursor-zoom-in touch-pan-y" />
          {selectedImage?.asset?.url && <Image src={selectedImage.asset.url} alt={productName ?? "Product image"} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="pointer-events-none object-contain" />}
          <span className="absolute bottom-3 right-3 z-20 bg-white/90 px-2 py-1 text-xs text-zinc-700">{selectedIndex + 1} / {items.length}</span>
        </div>
      </div>
      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="Product image viewer" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4" onTouchStart={(event) => swipeStart(event.touches[0]?.clientX ?? 0)} onTouchEnd={(event) => swipeEnd(event.changedTouches[0]?.clientX ?? 0)}>
          <button type="button" onClick={() => setLightbox(false)} aria-label="Close viewer" className="absolute right-3 top-3 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/35 bg-black/55 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:top-5"><X className="h-5 w-5" /></button>
          <button type="button" onClick={() => move(-1)} aria-label="Previous image" className="absolute left-3 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-8"><ChevronLeft className="h-8 w-8" /></button>
          <div className="relative h-[min(82svh,900px)] w-full max-w-5xl">{selectedImage?.asset?.url && <Image src={selectedImage.asset.url} alt={`${productName ?? "Product"}, image ${selectedIndex + 1}`} fill sizes="90vw" className="object-contain" />}</div>
          <button type="button" onClick={() => move(1)} aria-label="Next image" className="absolute right-3 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/40 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-8"><ChevronRight className="h-8 w-8" /></button>
          <div className="absolute bottom-4 text-sm text-white">{selectedIndex + 1} / {items.length}</div>
        </div>
      )}
    </>
  );
}

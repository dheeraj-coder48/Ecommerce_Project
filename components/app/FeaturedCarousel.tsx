"use client";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn, formatPrice } from "@/lib/utils";
import type { FEATURED_PRODUCTS_QUERYResult } from "@/sanity.types";

type Product = FEATURED_PRODUCTS_QUERYResult[number];
type Banner = {
  _id: string;
  title: string | null;
  subtitle: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  destinationType?: string | null;
  department?: string | null;
  customUrl?: string | null;
  categorySlug?: string | null;
  productSlug?: string | null;
  image: {
    _type?: string;
    asset: { _id?: string; url: string | null } | null;
    crop?: unknown;
    hotspot?: unknown;
  } | null;
};
export function FeaturedCarousel({
  products,
  banners = [],
}: {
  products: FEATURED_PRODUCTS_QUERYResult;
  banners?: Banner[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => {
      const snapCount = api.scrollSnapList().length;
      setCount(snapCount);
      setCurrent(
        snapCount > 0
          ? Math.max(0, Math.min(api.selectedScrollSnap(), snapCount - 1))
          : 0,
      );
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  const scroll = useCallback((i: number) => api?.scrollTo(i), [api]);
  const slides = [
    ...banners.map((b) => ({ kind: "banner" as const, data: b })),
    ...products.map((p) => ({ kind: "product" as const, data: p })),
  ];
  const autoplayPlugin = useMemo(
    () =>
      slides.length > 1
        ? Autoplay({
            delay: 6500,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
          })
        : null,
    [slides.length],
  );
  const carouselPlugins = useMemo(
    () => (autoplayPlugin ? [autoplayPlugin] : []),
    [autoplayPlugin],
  );

  useEffect(() => {
    if (!api) return;
    const resumeCarousel = () => {
      if (document.visibilityState !== "visible") return;
      const snapCount = api.scrollSnapList().length;
      const selectedSnap = api.selectedScrollSnap();
      if (snapCount > 0 && (selectedSnap < 0 || selectedSnap >= snapCount)) {
        api.scrollTo(0, true);
      }
      api.plugins().autoplay?.play();
    };
    document.addEventListener("visibilitychange", resumeCarousel);
    return () => {
      document.removeEventListener("visibilitychange", resumeCarousel);
    };
  }, [api]);

  if (!slides.length) return null;
  return (
    <section
      id="homepage-hero"
      aria-label="Featured collections"
      className="relative overflow-hidden"
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: slides.length > 1, align: "start" }}
        plugins={carouselPlugins}
      >
        <CarouselContent className="-ml-0">
          {slides.map((slide) => (
            <CarouselItem key={slide.data._id} className="pl-0">
              {slide.kind === "banner" ? (
                <BannerSlide banner={slide.data} />
              ) : (
                <ProductSlide product={slide.data} />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {slides.length > 1 && (
          <>
            <CarouselPrevious
              aria-label="Previous featured slide"
              className="left-4 border-white/50 bg-black/30 text-white hover:bg-white hover:text-black"
            />
            <CarouselNext
              aria-label="Next featured slide"
              className="right-4 border-white/50 bg-black/30 text-white hover:bg-white hover:text-black"
            />
            <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  type="button"
                  key={slides[i]?.data._id ?? `slide-${i}`}
                  onClick={() => scroll(i)}
                  aria-label={`Go to featured slide ${i + 1}`}
                  className={cn(
                    "h-1 transition-all",
                    i === current ? "w-8 bg-white" : "w-3 bg-white/50",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </section>
  );
}
function BannerSlide({ banner }: { banner: Banner }) {
  const bannerLink = resolveBannerLink(banner);
  const url = banner.image?.asset?.url ?? undefined;
  return (
    <div className="relative h-[100svh] bg-zinc-900 text-white">
      {url && (
        <Image
          src={url}
          alt={banner.title || "Men's ethnic wear collection"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
      {(banner.title || banner.subtitle || banner.ctaText) && (
        <div className="absolute right-4 bottom-20 left-4 max-w-xl pb-[env(safe-area-inset-bottom)] sm:right-auto sm:bottom-16 sm:left-12 sm:pb-0 lg:left-[10%]">
          {banner.title && (
            <h1 className="max-w-[14ch] text-[clamp(2rem,9vw,3rem)] font-semibold leading-tight sm:text-6xl">
              {banner.title}
            </h1>
          )}
          {banner.subtitle && (
            <p className="mt-3 max-w-md text-sm sm:text-base">
              {banner.subtitle}
            </p>
          )}
          {banner.ctaText && bannerLink && (
            <Button
              asChild
              className="mt-6 bg-white text-zinc-900 hover:bg-zinc-100"
            >
              <Link href={bannerLink}>
                {banner.ctaText}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
function ProductSlide({ product }: { product: Product }) {
  const url = product.images?.[0]?.asset?.url;
  return (
    <div className="relative h-[100svh] bg-[#30362f] text-white">
      {url && (
        <Image
          src={url}
          alt={product.name || "Featured clothing"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
      <div className="absolute right-4 bottom-20 left-4 max-w-xl pb-[env(safe-area-inset-bottom)] sm:right-auto sm:bottom-16 sm:left-12 sm:pb-0 lg:left-[10%]">
        <p className="text-xs font-semibold uppercase tracking-[.18em]">
          {product.gender || "Featured"}{" "}
          {product.category?.title ? `/ ${product.category.title}` : ""}
        </p>
        <h2 className="mt-3 text-[clamp(2rem,9vw,3rem)] font-semibold leading-tight sm:text-6xl">
          {product.name}
        </h2>
        <div className="mt-5 flex items-center gap-5">
          <Button asChild className="bg-white text-zinc-900 hover:bg-zinc-100">
            <Link href={`/products/${product.slug}`}>
              Shop now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <span className="font-sans text-lg font-semibold tracking-tight text-white">
            {formatPrice(product.price)}
          </span>
        </div>
      </div>
    </div>
  );
}

function resolveBannerLink(banner: Banner) {
  if (banner.destinationType === "category" && banner.categorySlug)
    return `/?${banner.department ? `gender=${encodeURIComponent(banner.department)}&` : ""}category=${encodeURIComponent(banner.categorySlug)}`;
  if (banner.destinationType === "product" && banner.productSlug)
    return `/products/${encodeURIComponent(banner.productSlug)}`;
  if (banner.destinationType === "custom" && banner.customUrl)
    return banner.customUrl;
  return banner.ctaLink || null;
}

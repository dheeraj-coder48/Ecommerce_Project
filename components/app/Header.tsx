"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Heart,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { STORE_NAME } from "@/lib/constants/store";
import { useCartActions, useTotalItems } from "@/lib/store/cart-store-provider";
import { useChatActions, useIsChatOpen } from "@/lib/store/chat-store-provider";
import { useWishlistStore } from "@/lib/store/wishlist-store-provider";

export function Header() {
  const { openCart } = useCartActions();
  const { openChat } = useChatActions();
  const isChatOpen = useIsChatOpen();
  const totalItems = useTotalItems();
  const wishlistCount = useWishlistStore((state) => state.products.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [heroActive, setHeroActive] = useState(pathname === "/");

  useLayoutEffect(() => {
    if (pathname !== "/") {
      setHeroActive(false);
      return;
    }

    let frame = 0;
    const syncHeaderFromHeroPosition = () => {
      const hero = document.getElementById("homepage-hero");
      if (!hero) {
        setHeroActive((current) => (current ? false : current));
        return;
      }

      const heroRect = hero.getBoundingClientRect();
      const headerHeight =
        headerRef.current?.getBoundingClientRect().height ?? 80;
      const isHeroActive = heroRect.top <= 0 && heroRect.bottom > headerHeight;
      setHeroActive((current) =>
        current === isHeroActive ? current : isHeroActive,
      );
    };

    const scheduleSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncHeaderFromHeroPosition();
      });
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") scheduleSync();
    };

    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    window.addEventListener("pageshow", scheduleSync);
    window.addEventListener("focus", scheduleSync);
    document.addEventListener("visibilitychange", syncWhenVisible);
    syncHeaderFromHeroPosition();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("pageshow", scheduleSync);
      window.removeEventListener("focus", scheduleSync);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [pathname]);

  const isOverlay = pathname === "/" && heroActive;

  return (
    <header
      ref={headerRef}
      data-overlay={isOverlay}
      className="home-hero-header sticky top-0 z-50 border-b border-[#e8e2d9]/80 bg-[#faf7f2]/95 backdrop-blur-md transition-all duration-300"
    >
      <div className="mx-auto flex h-[4.5rem] max-w-[1600px] items-center justify-between px-4 sm:px-8 lg:h-[5rem] lg:px-12">
        {/* Left: Mobile Toggle & Store logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="-ml-1 p-1 text-[#1a1a1a] transition-colors hover:text-[#1f3a2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="h-5 w-5 stroke-[1.5]" />
          </button>

          <Link
            href="/"
            className="group flex flex-col items-start transition-opacity hover:opacity-90"
          >
            <span className="font-serif text-[1.65rem] font-normal uppercase leading-none tracking-[0.2em] text-[#1a1a1a] sm:text-[1.8rem]">
              {STORE_NAME}
            </span>
            <span className="mt-1 font-sans text-[8px] font-medium uppercase tracking-[0.32em] text-[#6b6b6b]">
              Traditional &amp; Contemporary
            </span>
          </Link>
        </div>

        {/* Center: Curated Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link
            href="/?category=kurtas"
            className="relative py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#1a1a1a] after:content-[''] after:transition-all after:duration-300 hover:after:w-full"
          >
            Kurtas
          </Link>
          <Link
            href="/?category=sherwanis"
            className="relative py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#1a1a1a] after:content-[''] after:transition-all after:duration-300 hover:after:w-full"
          >
            Sherwanis
          </Link>
          <Link
            href="/?sort=newest"
            className="relative py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#1a1a1a] after:content-[''] after:transition-all after:duration-300 hover:after:w-full"
          >
            All Ethnic Wear
          </Link>
          <Link
            href="/?sort=newest"
            className="relative py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#1a1a1a] transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#1a1a1a] after:content-[''] after:transition-all after:duration-300 hover:after:w-full"
          >
            New Arrivals
          </Link>
        </nav>

        {/* Right: Search, AI Stylist, Orders, Bag, Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Minimalist Search Input */}
          <form
            action="/"
            className="hidden items-center gap-2 border-b border-zinc-300/80 px-1 py-0.5 focus-within:border-zinc-950 transition-colors lg:flex"
          >
            <Search className="h-3.5 w-3.5 text-zinc-400 stroke-[1.5]" />
            <input
              name="q"
              aria-label="Search garments"
              placeholder="SEARCH COLLECTION"
              className="w-28 bg-transparent text-[10px] tracking-[0.16em] uppercase outline-none placeholder:text-zinc-400 focus:w-36 transition-all"
            />
          </form>

          {/* AI Fashion Stylist Concierge */}
          {!isChatOpen && (
            <Button
              onClick={openChat}
              variant="outline"
              size="sm"
              className="ai-stylist-button h-9 shrink-0 cursor-pointer gap-2 rounded-sm px-3 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-none transition-colors duration-200"
            >
              <Sparkles className="ai-stylist-icon h-3 w-3" />
              <span className="hidden sm:inline">AI Stylist</span>
            </Button>
          )}

          {/* Client Orders */}
          <SignedIn>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex text-[11px] uppercase tracking-[0.16em] font-medium text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 h-8.5"
            >
              <Link href="/orders" className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>Orders</span>
              </Link>
            </Button>
          </SignedIn>

          {/* Shopping Bag */}
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} saved items` : ""}`}
            className="relative hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center text-[#1a1a1a] transition-colors hover:bg-[#f2ede4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:flex"
          >
            <Heart className="h-4 w-4 stroke-[1.5]" />
            {wishlistCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
            <span className="sr-only">Wishlist ({wishlistCount} items)</span>
          </Link>

          {/* Shopping Bag */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-none text-[#1a1a1a] hover:bg-[#f2ede4] hover:text-[#1a1a1a]"
            onClick={openCart}
            aria-label="Shopping Bag"
          >
            <ShoppingBag className="h-4 w-4 stroke-[1.5]" />
            {totalItems > 0 && (
              <span className="absolute 1 top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-white dark:bg-white dark:text-zinc-950">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
            <span className="sr-only">
              Open shopping bag ({totalItems} pieces)
            </span>
          </Button>

          {/* User Profile */}
          <SignedIn>
            <div className="flex items-center pl-1">
              <UserButton
                afterSwitchSessionUrl="/"
                appearance={{
                  elements: {
                    avatarBox:
                      "h-7 w-7 rounded-none border border-zinc-300 dark:border-zinc-700",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Orders"
                    labelIcon={<Package className="h-4 w-4" />}
                    href="/orders"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none text-zinc-800 hover:text-zinc-950 dark:text-zinc-200"
                aria-label="Sign in"
              >
                <User className="h-4 w-4 stroke-[1.5]" />
              </Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Editorial Navigation Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="md:hidden border-t border-[#e5e2da] bg-[#faf8f5] px-6 py-6 dark:border-zinc-800 dark:bg-zinc-950 animate-in fade-in duration-200"
        >
          <form
            action="/"
            className="mb-6 flex items-center gap-2 border-b border-zinc-300 pb-2.5 focus-within:border-zinc-950"
          >
            <Search className="h-4 w-4 text-zinc-400 stroke-[1.5]" />
            <input
              name="q"
              aria-label="Search garments"
              placeholder="Search by silhouette, fabric, style..."
              className="w-full bg-transparent text-xs tracking-wider uppercase outline-none placeholder:text-zinc-400"
            />
          </form>

          <div className="flex flex-col space-y-3.5 divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
            <div className="flex flex-col space-y-3 pt-1">
              <Link
                href="/?sort=newest"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-[0.2em] font-semibold text-zinc-950 dark:text-white"
              >
                New Arrivals
              </Link>
            </div>

            <div className="flex flex-col space-y-3 pt-3.5">
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-zinc-400">
                Categories
              </p>
              <Link
                href="/?category=kurta-sets"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300"
              >
                Kurta Sets
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300"
              >
                Shop All Ethnic Wear
              </Link>
              <Link
                href="/?sort=newest"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300"
              >
                Ethnic & Occasion Wear
              </Link>
            </div>

            <div className="pt-3.5 flex flex-col space-y-2.5">
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-medium text-zinc-700 dark:text-zinc-300 sm:hidden"
              >
                <Heart className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>My Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-bold text-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>
              <SignedIn>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs uppercase tracking-[0.18em] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2"
                >
                  <Package className="h-3.5 w-3.5 stroke-[1.5]" />
                  <span>My Orders</span>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

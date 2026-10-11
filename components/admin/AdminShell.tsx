"use client";

import { ClerkProvider } from "@clerk/nextjs";
import {
  ExternalLink,
  Images,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  { label: "Banners", href: "/admin/banners", icon: Images },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ClerkProvider>
      <div className="flex min-h-screen bg-[#f1efe9] dark:bg-zinc-950">
        {/* Mobile Header */}
        <div className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#252722] px-4 text-white lg:hidden">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center border border-white/40">
              <span className="font-serif text-lg text-white">A</span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white">
              Store management
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/10 bg-[#252722] text-[#f3f0e8] transition-transform",
            // Mobile: slide in/out
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            // Desktop: always visible
            "lg:translate-x-0",
          )}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-24 flex-col items-start justify-center border-b border-white/15 px-6">
              <Link
                href="/admin"
                className="flex flex-col items-start"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="font-serif text-2xl tracking-[0.16em] text-white">
                  Store Admin
                </span>
                <span className="mt-1 text-[8px] uppercase tracking-[0.3em] text-white/45">
                  Commerce studio
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-8">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 border-l-2 px-3 py-3 text-[10px] font-medium uppercase tracking-[0.18em] transition-colors",
                      isActive
                        ? "border-[#c7a88a] bg-white/5 text-white"
                        : "border-transparent text-white/55 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="space-y-3 border-t border-white/15 px-3 py-5">
              <Link
                href="/studio"
                target="_blank"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between gap-2 border border-white/25 px-3 py-3 text-[9px] font-medium uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/10"
              >
                Open Studio
                <ExternalLink className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="block px-3 text-[9px] uppercase tracking-[0.16em] text-white/50 hover:text-white"
              >
                ← Back to Store
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pt-14 lg:ml-64 lg:pt-0">
          <div className="mx-auto max-w-[1600px] p-4 sm:p-7 lg:p-12">
            {children}
          </div>
        </main>
      </div>
    </ClerkProvider>
  );
}

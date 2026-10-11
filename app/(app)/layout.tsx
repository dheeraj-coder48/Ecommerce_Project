import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/app/AppShell";
import { CartSheet } from "@/components/app/CartSheet";
import { ChatSheet } from "@/components/app/ChatSheet";
import { Footer } from "@/components/app/Footer";
import { Header } from "@/components/app/Header";
import { Toaster } from "@/components/ui/sonner";
import { CartStoreProvider } from "@/lib/store/cart-store-provider";
import { ChatStoreProvider } from "@/lib/store/chat-store-provider";
import { WishlistStoreProvider } from "@/lib/store/wishlist-store-provider";
import { SanityLive } from "@/sanity/lib/live";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <CartStoreProvider>
        <WishlistStoreProvider>
          <ChatStoreProvider>
            <AppShell>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </AppShell>
            <CartSheet />
            <ChatSheet />
            <Toaster position="bottom-center" />
            <SanityLive />
          </ChatStoreProvider>
        </WishlistStoreProvider>
      </CartStoreProvider>
    </ClerkProvider>
  );
}

export default AppLayout;

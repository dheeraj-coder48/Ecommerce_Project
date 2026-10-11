import { CreditCard, Instagram, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { LocateUs } from "@/components/app/LocateUs";
import { PolicyLinks } from "@/components/app/PolicyLinks";
import {
  KUMAR_COLLECTION_INSTAGRAM_URL,
  KUMAR_COLLECTION_WHATSAPP_URL,
} from "@/lib/constants/social";
import { STORE_NAME, STORE_PHONE, TRACK_ORDER_URL } from "@/lib/constants/store";

export function Footer() {
  return (
    <footer className="border-t border-[#b08d57]/70 bg-[#1a1a1a] text-[#faf7f2]">
      <div className="mx-auto max-w-[1600px] px-5 pt-9 sm:px-8 lg:px-12 lg:pt-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-white/15 pb-10 sm:grid-cols-3 lg:grid-cols-[1.35fr_0.72fr_1fr_0.9fr_1fr_1.4fr] lg:gap-x-8 lg:gap-y-8 lg:pb-10">
          <div className="flex flex-col justify-start gap-3 sm:col-span-1">
            <Link
              href="/"
              className="font-serif text-3xl tracking-[0.12em] text-[#faf7f2] sm:text-4xl"
            >
              {STORE_NAME}
            </Link>
            <p className="max-w-sm text-[10px] uppercase leading-5 tracking-[0.16em] text-white/70">
              Traditional &amp; contemporary ethnic wear
              <br />
              for men, crafted for every occasion.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {KUMAR_COLLECTION_INSTAGRAM_URL ? (
                <a
                  href={KUMAR_COLLECTION_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kumar Collection on Instagram"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-white/20 text-white/75 transition-all duration-200 hover:scale-105 hover:border-[#b08d57] hover:bg-white/10 hover:text-white"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </a>
              ) : (
                <span
                  role="img"
                  aria-label="Instagram profile URL not configured"
                  title="Instagram profile URL not configured"
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/55"
                >
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                </span>
              )}
              {KUMAR_COLLECTION_WHATSAPP_URL ? (
                <a
                  href={KUMAR_COLLECTION_WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact Kumar Collection on WhatsApp"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-white/20 text-white/75 transition-all duration-200 hover:scale-105 hover:border-[#b08d57] hover:bg-white/10 hover:text-white"
                >
                  <span className="relative inline-flex" aria-hidden="true">
                    <MessageCircle className="h-4 w-4" />
                    <Phone className="absolute left-[5px] top-[5px] h-1.5 w-1.5" />
                  </span>
                  <span className="sr-only">WhatsApp</span>
                </a>
              ) : (
                <span
                  role="img"
                  aria-label="WhatsApp contact URL not configured"
                  title="WhatsApp contact URL not configured"
                  className="inline-flex h-10 w-10 items-center justify-center border border-white/15 text-white/55"
                >
                  <span className="relative inline-flex" aria-hidden="true">
                    <MessageCircle className="h-4 w-4" />
                    <Phone className="absolute left-[5px] top-[5px] h-1.5 w-1.5" />
                  </span>
                </span>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
              Shop
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/85">
                <li>
                  <Link href="/?sort=newest" className="hover:text-white">
                    New arrivals
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    All ethnic wear
                  </Link>
                </li>
            </ul>
          </div>
          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
              Collections
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/85">
                <li>
                  <Link href="/?category=kurtas" className="hover:text-white">
                    Kurtas
                  </Link>
                </li>
                <li>
                  <Link href="/?category=sherwanis" className="hover:text-white">
                    Sherwanis
                  </Link>
                </li>
                <li><Link href="/?category=nehru-jackets" className="hover:text-white">Nehru Jackets</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
              Customer
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/85">
                <li>
                  <Link href="/orders" className="hover:text-white">
                    Orders
                  </Link>
                </li>
                <li>
                  <Link href="/" className="hover:text-white">
                    Continue shopping
                  </Link>
                </li>
                <li>
                  <a
                    href={TRACK_ORDER_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white"
                  >
                    Track Order
                  </a>
                </li>
            </ul>
          </div>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
              Locate Us
            </h2>
            <div className="mt-3">
              <LocateUs />
            </div>
            <div className="mt-4">
              <h3 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
                Contact Us
              </h3>
              <a
                href={`tel:${STORE_PHONE}`}
                aria-label={`Call Kumar Collection at ${STORE_PHONE}`}
                className="mt-1 inline-block cursor-pointer text-sm leading-6 text-white/85 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {STORE_PHONE}
              </a>
            </div>
          </div>

          <div>
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/65">
              Our policies
            </h2>
            <PolicyLinks />
          </div>
        </div>
        <div className="grid grid-cols-1 items-center gap-4 py-5 text-[9px] uppercase tracking-[0.16em] text-white/60 sm:grid-cols-[1fr_auto_1fr]">
          <span className="order-3 sm:order-1">
            © {new Date().getFullYear()} {STORE_NAME}
          </span>
          <div className="order-1 flex flex-wrap items-center gap-2 sm:order-2 sm:justify-center">
            <span className="text-white/60">Secure Payments</span>
            <span className="inline-flex items-center gap-1.5 border border-white/20 px-2.5 py-1.5 text-white/80">
              <ShieldCheck className="h-3.5 w-3.5 text-[#b08d57]" aria-hidden="true" />
              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cards</span>
            </span>
          </div>
          <span className="order-2 sm:order-3 sm:text-right">Made with love</span>
        </div>
      </div>
    </footer>
  );
}

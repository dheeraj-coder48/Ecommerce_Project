"use client";

import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  STORE_ADDRESS,
  STORE_DIRECTIONS_URL,
  STORE_MAP_URL,
} from "@/lib/constants/store-location";

export function LocateUs() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group inline-flex cursor-pointer items-center gap-2 text-sm text-white/85 transition-colors hover:text-white"
        >
          <MapPin className="h-4 w-4" />
          Visit Our Store{" "}
          <span
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
          >
            ?
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl gap-0 overflow-y-auto rounded-none border-0 bg-white p-0 text-zinc-950">
        <div className="flex items-start justify-between px-5 pb-4 pt-6 sm:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-zinc-500">
              Kumar Collection
            </p>
            <DialogTitle className="mt-2 font-serif text-3xl font-normal">
              Find our store
            </DialogTitle>
            <DialogDescription className="sr-only">
              Store location and directions
            </DialogDescription>
          </div>
          <DialogTrigger asChild>
            {/* <button
              type="button"
              aria-label="Close location dialog"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
            >
              <X className="h-5 w-5" />
            </button> */}
          </DialogTrigger>
        </div>
        <div className="px-5 sm:px-8">
          <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 sm:aspect-[16/8]">
            {STORE_MAP_URL ? (
              <iframe
                title="Kumar Collection store map"
                src={STORE_MAP_URL}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-zinc-500">
                <MapPin className="h-8 w-8" />
                <p className="max-w-sm text-sm">
                  Store map will appear here once the address is configured.
                </p>
              </div>
            )}
          </div>
          <div className="py-6">
            <h2 className="font-serif text-xl">Kumar Collection</h2>
            {STORE_ADDRESS && (
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                {STORE_ADDRESS}
              </p>
            )}
            <Button
              asChild
              disabled={!STORE_DIRECTIONS_URL}
              className="mt-5 h-11 rounded-none bg-zinc-950 px-6 text-[10px] font-semibold uppercase tracking-[.18em] text-white hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-40"
            >
              <a
                href={STORE_DIRECTIONS_URL || undefined}
                target="_blank"
                rel="noreferrer"
              >
                Get directions
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";

type DeliveryState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "available"; estimate: string | null }
  | { type: "unavailable" }
  | { type: "error" };

export function DeliveryChecker() {
  const [pincode, setPincode] = useState("");
  const [hasNonNumericInput, setHasNonNumericInput] = useState(false);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>({
    type: "idle",
  });
  const isValid = !hasNonNumericInput && /^\d{6}$/.test(pincode);
  const isInvalid = hasNonNumericInput || (pincode.length > 0 && !isValid);

  async function checkDelivery() {
    if (!isValid || deliveryState.type === "loading") return;

    setDeliveryState({ type: "loading" });
    try {
      const response = await fetch("/api/shipping/check-pincode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const result: {
        available?: boolean;
        estimate?: string | null;
      } = await response.json();

      if (!response.ok || typeof result.available !== "boolean") {
        setDeliveryState({ type: "error" });
      } else if (result.available) {
        setDeliveryState({
          type: "available",
          estimate: result.estimate ?? null,
        });
      } else {
        setDeliveryState({ type: "unavailable" });
      }
    } catch {
      setDeliveryState({ type: "error" });
    }
  }

  const message = (() => {
    if (isInvalid) return "Please enter a valid 6-digit pincode.";
    switch (deliveryState.type) {
      case "idle":
        return "Enter your pincode to check delivery";
      case "loading":
        return "Checking delivery...";
      case "available":
        return "Delivery available";
      case "unavailable":
        return "Sorry, delivery is currently unavailable to this pincode.";
      case "error":
        return "We couldn't check delivery right now. Please try again.";
    }
  })();

  return (
    <section
      aria-labelledby="delivery-checker-title"
      className="mt-5 border-y border-[#e5e2da] py-4 dark:border-zinc-800"
    >
      <h2
        id="delivery-checker-title"
        className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-600 dark:text-zinc-300"
      >
        Check Delivery
      </h2>
      <form
        className="mt-3 flex w-full max-w-md gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void checkDelivery();
        }}
      >
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="delivery-pincode">
            Enter your 6-digit pincode
          </label>
          <input
            id="delivery-pincode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={pincode}
            onChange={(event) => {
              setHasNonNumericInput(/\D/.test(event.target.value));
              setPincode(event.target.value.replace(/\D/g, "").slice(0, 6));
              setDeliveryState({ type: "idle" });
            }}
            placeholder="Enter pincode"
            aria-invalid={isInvalid}
            aria-describedby="delivery-status delivery-hint"
            className="h-11 w-full rounded-none border border-[#d8d2c8] bg-transparent px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-600 focus-visible:border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder:text-zinc-400 dark:focus-visible:border-white dark:focus-visible:ring-white"
          />
        </div>
        <button
          type="submit"
          disabled={!isValid || deliveryState.type === "loading"}
          className="h-11 shrink-0 cursor-pointer border border-zinc-900 bg-zinc-900 px-4 text-[10px] font-semibold tracking-[0.16em] text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-200 disabled:text-zinc-600 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-300"
        >
          {deliveryState.type === "loading" ? "CHECKING" : "CHECK"}
        </button>
      </form>
      <p
        id="delivery-hint"
        className="mt-2 text-xs text-zinc-500 dark:text-zinc-400"
      >
        India · 6-digit pincode
      </p>
      <output
        id="delivery-status"
        aria-live="polite"
        className={`mt-3 min-h-5 text-sm ${isInvalid || deliveryState.type === "unavailable" || deliveryState.type === "error" ? "text-[#8b2e2e]" : "text-zinc-700 dark:text-zinc-200"}`}
      >
        {deliveryState.type === "available" ? "✓ " : ""}
        {deliveryState.type === "unavailable" ? "✕ " : ""}
        {message}
      </output>
      {deliveryState.type === "available" && deliveryState.estimate && (
        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
          {deliveryState.estimate}
        </p>
      )}
    </section>
  );
}

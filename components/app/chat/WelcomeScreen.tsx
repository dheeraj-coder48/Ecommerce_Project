import { Package, Search, Sparkles } from "lucide-react";

interface WelcomeScreenProps {
  onSuggestionClick: (message: { text: string }) => void;
  isSignedIn: boolean;
}

const productSuggestions = [
  "Sherwanis for a wedding",
  "Kurta sets under ₹3000",
  "Festive wear for men",
  "Nehru jackets for weddings",
];

const orderSuggestions = [
  "Where's my order?",
  "Show me my recent orders",
  "Has my order shipped?",
];

export function WelcomeScreen({
  onSuggestionClick,
  isSignedIn,
}: WelcomeScreenProps) {
  return (
    <div className="flex min-h-full flex-col items-center px-1 pb-2 pt-3 text-center">
      <div className="flex h-11 w-11 items-center justify-center border border-[#dedbd3] bg-[#f1efe9] dark:border-zinc-800 dark:bg-zinc-900">
        <Sparkles className="h-5 w-5 text-[#526556] dark:text-zinc-100" />
      </div>
      <h3 className="mt-3 font-serif text-xl font-normal tracking-wide text-zinc-900 dark:text-zinc-100">
        AI Fashion Stylist
      </h3>
      <p className="mt-2 max-w-[19rem] text-[13px] leading-6 text-zinc-500 dark:text-zinc-400">
        {isSignedIn
          ? "Ask for styling advice, outfit recommendations, size checks, or track your orders."
          : "Discover garments by silhouette, fabric, color, or price. Ask me for recommendations!"}
      </p>

      {/* Product suggestions */}
      <div className="mt-6 w-full max-w-sm text-left">
        <div className="mb-3 flex items-center gap-2 border-b border-[#e5e1d8] pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <Search className="h-3 w-3" />
          Recommended Queries
        </div>
        <div className="flex flex-wrap gap-2">
          {productSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick({ text: suggestion })}
              className="min-h-9 rounded-sm border border-[#dedbd3] bg-white px-3 py-2 text-left text-xs leading-4 text-zinc-700 transition-colors hover:border-[#526556] hover:bg-[#f6f4ef] active:bg-[#eeece6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526556]/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Order suggestions - only for signed in users */}
      {isSignedIn && (
        <div className="mt-5 w-full max-w-sm border-t border-[#e5e1d8] pt-4 text-left dark:border-zinc-800">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            <Package className="h-3 w-3" />
            Your Orders
          </div>
          <div className="flex flex-wrap gap-2">
            {orderSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick({ text: suggestion })}
                className="min-h-9 rounded-sm border border-[#dedbd3] bg-[#f4f2ec] px-3 py-2 text-left text-xs leading-4 text-zinc-700 transition-colors hover:border-[#526556] hover:bg-[#eeece6] active:bg-[#e7e4dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526556]/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-500"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

